const CreateZone = require('./zone');
const CreateDevice = require('./device');
const DropDatabase = require('./database');
const connectDatabase = require(`${ process.ROOTDIR }/server/tools/mongoDB/${ process.platform }/connectDatabase`);

function seedDatabase() {
  connectDatabase();
  return DropDatabase()
    .then(CreateZone)
    .then((zones) => zones.map(CreateDevice))
    .catch((seedError) => {
      throw new Error(seedError);
    });
}

module.exports = process.env.NODE_ENV === 'local' ? seedDatabase : () => true;
