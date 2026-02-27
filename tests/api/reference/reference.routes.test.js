const { expectRouteToUse } = require('../../helpers/routeBindings');

describe('Reference: роуты вызывают нужные функции контроллера', () => {
  const router = require('../../../src/api/modules/reference/routes');
  const controller = require('../../../src/api/modules/reference/controller');

  test('GET /rooms → getRooms', () => expectRouteToUse(router, 'get', '/rooms', controller.getRooms));
  test('GET /access → getAccess', () => expectRouteToUse(router, 'get', '/access', controller.getAccess));
  test('GET /positions → getPositions', () => expectRouteToUse(router, 'get', '/positions', controller.getPositions));
  test('GET /docs → getDocs', () => expectRouteToUse(router, 'get', '/docs', controller.getDocs));
  test('GET /types-of-holding → getTypesOfHolding', () => expectRouteToUse(router, 'get', '/types-of-holding', controller.getTypesOfHolding));
  test('GET /levels → getLevels', () => expectRouteToUse(router, 'get', '/levels', controller.getLevels));
});
