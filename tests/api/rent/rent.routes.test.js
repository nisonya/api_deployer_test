const { expectRouteToUse } = require('../../helpers/routeBindings');

describe('Rent: роуты вызывают нужные функции контроллера', () => {
  const router = require('../../../src/api/modules/rent/routes');
  const controller = require('../../../src/api/modules/rent/controller');

  test('GET /by-event/:id → getByEvent', () => expectRouteToUse(router, 'get', '/by-event/:id', controller.getByEvent));
  test('GET /by-id/:id → getById', () => expectRouteToUse(router, 'get', '/by-id/:id', controller.getById));
  test('POST /by-date-room → getByDateAndRoom', () => expectRouteToUse(router, 'post', '/by-date-room', controller.getByDateAndRoom));
  test('POST / → newRent', () => expectRouteToUse(router, 'post', '/', controller.newRent));
  test('PUT / → updateRent', () => expectRouteToUse(router, 'put', '/', controller.updateRent));
  test('DELETE /:id → deleteRent', () => expectRouteToUse(router, 'delete', '/:id', controller.deleteRent));
});
