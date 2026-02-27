const { expectRouteToUse } = require('../../helpers/routeBindings');

describe('Groups: роуты вызывают нужные функции контроллера', () => {
  const router = require('../../../src/api/modules/groups/routes');
  const controller = require('../../../src/api/modules/groups/controller');

  test('GET /by-teacher/:id → getGroupsByTeacher', () => expectRouteToUse(router, 'get', '/by-teacher/:id', controller.getGroupsByTeacher));
  test('GET /table → getTableStudentsGroup', () => expectRouteToUse(router, 'get', '/table', controller.getTableStudentsGroup));
  test('GET /pixels/:id → getPixelsByGroup', () => expectRouteToUse(router, 'get', '/pixels/:id', controller.getPixelsByGroup));
  test('GET /list → getList', () => expectRouteToUse(router, 'get', '/list', controller.getList));
  test('PUT /pixels → updatePixels', () => expectRouteToUse(router, 'put', '/pixels', controller.updatePixels));
});
