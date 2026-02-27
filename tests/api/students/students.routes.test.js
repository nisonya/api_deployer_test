const { expectRouteToUse } = require('../../helpers/routeBindings');

describe('Students: роуты вызывают нужные функции контроллера', () => {
  const router = require('../../../src/api/modules/students/routes');
  const controller = require('../../../src/api/modules/students/controller');

  test('GET /search → searchByLetter', () => expectRouteToUse(router, 'get', '/search', controller.searchByLetter));
  test('GET /search/:letter → searchByLetter', () => expectRouteToUse(router, 'get', '/search/:letter', controller.searchByLetter));
  test('GET /search-new → searchByLetterNew', () => expectRouteToUse(router, 'get', '/search-new', controller.searchByLetterNew));
  test('GET /search-new/:letter → searchByLetterNew', () => expectRouteToUse(router, 'get', '/search-new/:letter', controller.searchByLetterNew));
  test('GET /groups-by-student/:id → getGroupsByStudent', () => expectRouteToUse(router, 'get', '/groups-by-student/:id', controller.getGroupsByStudent));
  test('GET /by-group/:id → getByGroupId', () => expectRouteToUse(router, 'get', '/by-group/:id', controller.getByGroupId));
  test('GET /full-by-group/:id → getFullInfByGroup', () => expectRouteToUse(router, 'get', '/full-by-group/:id', controller.getFullInfByGroup));
  test('GET /:id → getById', () => expectRouteToUse(router, 'get', '/:id', controller.getById));
  test('PUT /exist → checkExist', () => expectRouteToUse(router, 'put', '/exist', controller.checkExist));
  test('POST /add-to-group → addToGroup', () => expectRouteToUse(router, 'post', '/add-to-group', controller.addToGroup));
  test('POST / → addStudent', () => expectRouteToUse(router, 'post', '/', controller.addStudent));
  test('PUT / → updateStudent', () => expectRouteToUse(router, 'put', '/', controller.updateStudent));
  test('PUT /update-to-group → updateStudentToGroup', () => expectRouteToUse(router, 'put', '/update-to-group', controller.updateStudentToGroup));
  test('DELETE /from-group → deleteFromGroup', () => expectRouteToUse(router, 'delete', '/from-group', controller.deleteFromGroup));
});
