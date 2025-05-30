# authapp
An authentication app that currently supports token-based authentication and email verification by OTP. This application utilizes Spring Boot for the backend, React for the frontend, and PostgreSQL for the Data Store.

[![Authapp CI](https://github.com/chintakjoshi/authapp/actions/workflows/tests.yml/badge.svg?branch=main)](https://github.com/chintakjoshi/authapp/actions/workflows/tests.yml)

## Prerequisites
* Java 21.0.6
* Apache Maven 3.9.9
* NodeJS v22.14.0
* Docker
  
## Step 1
* Rename `.env-sample` to `.env`
* Insert your credentials in the environment variables. (To create your credentials, click [here](https://myaccount.google.com/apppasswords)).

## Step 2
* Run the following command in the root directory `./mvnw clean package -DskipTests`. This will install dependencies for the spring app. (Note - This command is for Windows)
* Run `docker-compose up --build -d`, to start the docker containers. (PostgreSQL, spring, react).
* Access DB `docker exec -it (containerID) psql -U postgres -d authdb`.

### High Level Design:
<div style="display: flex; justify-content: space-between;">
  <img src="./images/hld.png">
</div>

### Sequence Diagram:
<div style="display: flex; justify-content: space-between;">
  <img src="./images/sequence.png">
</div>