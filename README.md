# discord-reminder-bot

A Discord bot that reads a list of people who click on a certain reaction and sends them a message at a time of your choosing. Kind of janky right now.

## Deployment

Deploy it on Docker using the included `Dockerfile` and `docker-compose.yml`.

## Configuration

* Create a `config.json` file based on `config.json.example`.
* Create a job file in `data/jobs/` based on `data/jobs/test.json.example`.
* Restart the bot every time you edit the jobs.
