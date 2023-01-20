module.exports = [
  {
    method: 'POST',
    path: '/',
    handler: 'migrateController.migrate',
  },
  {
    method: 'GET',
    path: '/config',
    handler: 'migrateController.getConfig',
  },
];
