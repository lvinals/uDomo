#!/bin/bash
#### Automate various common task to init a recently downloaded copy of uDomo ####
# Author: Lucas Viñals
# Created: 04/2016
# Modified: 06/2017

# Main directory
HOMEDIR=~
# ESP8266 Libraries
LIBRARIESDIR=$HOMEDIR'/Arduino/libraries'
# Server main directory
SERVERDIR=$HOMEDIR'/uDomo/server'

# Install NodeJS
echo -e '\e[44m> Installing NodeJS \e[0m\n'
(
  if [ ! -d $HOMEDIR'/.nvm' ]; then
    cd $HOMEDIR
    rm -rf .nvm
    git clone https://github.com/creationix/nvm.git .nvm
    cd .nvm
    # Install NVM
    ./install.sh
  fi
  # Update PATH to use NVM
  source $HOMEDIR/.bashrc
  source $HOMEDIR/.nvm/nvm.sh
  # This installs the latest NodeJS version. For production, it's recommended to add '--lts' flag.
  nvm install node
)

# Install required packages
echo -e '\e[103m\e[91m> Updating the system and installing needed software \e[0m'
# MongoDB installs (04/10/2016) the outdated v2.4 in Raspbian (Debian), but we're good for now.
su - root -c 'apt -qq update && apt --yes --force-yes install bash git mongodb realpath yarn redis-server'

# Check if there is an Arduino libraries directory; if not, create.
if [ ! -d $LIBRARIESDIR ]; then
  echo -e '\e[103m\e[91m> The tree directory '$LIBRARIESDIR' doesn\''t exists. Creating...\e[0m'
  mkdir -p $LIBRARIESDIR
fi

# Download SocketIO para ESP8266
if [ ! -d $LIBRARIESDIR'/Socket.io-v1.x-Library' ]; then
  echo -e '\e[103m\e[91m> Downloading SocketIO...\e[0m'
  ( cd $LIBRARIESDIR && git clone https://github.com/washo4evr/Socket.io-v1.x-Library.git )
fi

# Download ArduinoJSON
if [ ! -d $LIBRARIESDIR'/ArduinoJson' ]; then
  echo -e '\e[103m\e[91m> Downloading ArduinoJson...\e[0m'
  ( cd $LIBRARIESDIR && git clone https://github.com/bblanchon/ArduinoJson.git )
fi

# Download ESP8266TrueRandom
if [ ! -d $LIBRARIESDIR'/ESP8266TrueRandom' ]; then
  echo -e '\e[103m\e[91m> Downloading ESP8266TrueRandom...\e[0m'
  ( cd $LIBRARIESDIR && git clone https://github.com/marvinroger/ESP8266TrueRandom.git )
fi

# If there is an old log, erase it.
rm -f $SERVERDIR'/npm-debug.log'

# Check if there is a database directory; if not, create.
if [ ! -d $SERVERDIR'/db' ]; then
  echo -e '\e[103m\e[91m> The tree directory db doesn\''t exists. Creating...\e[0m'
  mkdir -p $SERVERDIR'/db/data/db'
  mkdir $SERVERDIR'/db/logs' && echo '<------ uDomo Database Log ------>' > $SERVERDIR'/db/logs/log.txt'
fi


echo -e '\e[44m> Installing/updating libraries \e[0m\n'
# Install all project dependencies
( cd $HOMEDIR'/uDomo' && yarn --ignore-engines)
# Install some aditional (recommended) global packages
yarn global add nsp snyk npm-check

echo -e '\e[103m\e[91m> Checking dependencies vulnerabilities...\e[0m'
nsp check
yarn run snyk-auth &
yarn run snyk-protect
# yarn run snyk-test

# Set a cron service to start the application when there is a network running.
if [ ! -f '/etc/network/if-up.d/uDomo' ]; then
  su - root -c 'cat '$SERVERDIR'/tools/initOnIFUP.txt > /etc/network/if-up.d/uDomo'
  su - root -c 'chmod 0600 /etc/network/if-up.d/uDomo'
fi

echo -e '\n\e[91m\e[103m> Please, edit the database file in '$SERVERDIR'/config/db.js accordingly. \n'
echo -e '\n\e[42m\e[97m> All system is ready. Please, start the uDomo service with "yarn run production" or "yarn run development" when the system is configured. \e[0m'
