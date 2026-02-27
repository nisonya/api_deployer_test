const { expectRouteToUse } = require('../../helpers/routeBindings');

describe('Events part: роуты вызывают нужные функции контроллера', () => {
  const router = require('../../../src/api/modules/events/partRoutes');
  const controller = require('../../../src/api/modules/events/partController');

  test('POST /list → list', () => expectRouteToUse(router, 'post', '/list', controller.list));
  test('POST /count → count', () => expectRouteToUse(router, 'post', '/count', controller.count));
  test('GET /resp-table → respTable', () => expectRouteToUse(router, 'get', '/resp-table', controller.respTable));
  test('GET /full-inf/:id → fullInf', () => expectRouteToUse(router, 'get', '/full-inf/:id', controller.fullInf));
  test('GET /responsible/:id → responsible', () => expectRouteToUse(router, 'get', '/responsible/:id', controller.responsible));
  test('GET /responsible-new/:id → responsibleNew', () => expectRouteToUse(router, 'get', '/responsible-new/:id', controller.responsibleNew));
  test('GET /notifications-today/:id → notificationsToday', () => expectRouteToUse(router, 'get', '/notifications-today/:id', controller.notificationsToday));
  test('GET /notifications-tomorrow/:id → notificationsTomorrow', () => expectRouteToUse(router, 'get', '/notifications-tomorrow/:id', controller.notificationsTomorrow));
  test('PUT /notifications → notifications', () => expectRouteToUse(router, 'put', '/notifications', controller.notifications));
  test('POST / → add', () => expectRouteToUse(router, 'post', '/', controller.add));
  test('PUT / → update', () => expectRouteToUse(router, 'put', '/', controller.update));
  test('PUT /result → updateResult', () => expectRouteToUse(router, 'put', '/result', controller.updateResult));
  test('PUT /mark → updateMark', () => expectRouteToUse(router, 'put', '/mark', controller.updateMark));
  test('POST /responsible → newResponsible', () => expectRouteToUse(router, 'post', '/responsible', controller.newResponsible));
  test('DELETE /responsible → deleteResponsible', () => expectRouteToUse(router, 'delete', '/responsible', controller.deleteResponsible));
  test('DELETE /:id → deleteEvent', () => expectRouteToUse(router, 'delete', '/:id', controller.deleteEvent));
});
