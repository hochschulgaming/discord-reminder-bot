const fs = require('fs')
const glob = require('glob')
const Discord = require('discord.js')
const schedule = require('node-schedule')
const config = require('./config.json')

const TOKEN = config.token
const JOBS_PATTERN = './data/jobs/*.json'
const OPTOUT_DB = './data/optout.json'
const MESSAGE_SPACING = 1000 // ms
const REACTION_LIMIT = 100
const OPTOUT_COMMAND = '!stop'
const OPTOUT_RESPONSE = 'Okay, wir nerven dich nicht mehr. :('

const optOutList = require(OPTOUT_DB)

const client = new Discord.Client()

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function getReaction (job) {
  const guild = await client.guilds.fetch(job.guild)
  if (!guild) {
    throw new Error(`Guild ${job.guild} not found`)
  }

  const channel = guild.channels.cache.get(job.channel)
  if (!channel) {
    throw new Error(`Channel ${job.channel} not found`)
  }

  const message = await channel.messages.fetch(job.message)
  if (!message) {
    throw new Error(`Message ${job.message} not found`)
  }

  const reaction = message.reactions.cache.find(x => x.emoji.name === job.reaction)
  if (!reaction) {
    throw new Error(`Reaction ${job.reaction} not found`)
  }

  return reaction
}

async function executeJob (job) {
  console.log('Executing job')
  const reaction = await getReaction(job)
  const users = await reaction.users.fetch({ limit: REACTION_LIMIT })

  for (const user of users.array()) {
    if (optOutList.includes(user.id)) {
      console.log(`Skipping ${user.username} due to opt-out`)
      continue
    }

    console.log(`Sending message to ${user.username}`)
    await user.send(job.template)
    await sleep(MESSAGE_SPACING)
  }
}

function loadJobs () {
  const paths = glob.sync(JOBS_PATTERN, { absolute: true })
  return paths.map(path => require(path))
}

async function scheduleJobs () {
  const jobs = loadJobs()
  console.info(`Loaded ${jobs.length} job(s)`)

  for (const job of jobs) {
    const datetime = new Date(job.datetime)
    if (datetime < new Date()) {
      console.info('Skipping job from the past')
    }

    // make sure it exists
    getReaction(job)

    schedule.scheduleJob(datetime, () => {
      executeJob(job).catch(console.error)
    })
  }
}

async function optOut (user) {
  optOutList.push(user.id)
  fs.writeFileSync(OPTOUT_DB, JSON.stringify(optOutList))
  user.send(OPTOUT_RESPONSE)
}

client.on('ready', () => {
  console.info(`Logged in as ${client.user.tag}`)
  scheduleJobs().catch(console.error)
})

client.on('message', message => {
  if (message.content.trim().toLowerCase() === OPTOUT_COMMAND.toLowerCase()) {
    optOut(message.author).catch(console.error)
  }
})

client.login(TOKEN)
