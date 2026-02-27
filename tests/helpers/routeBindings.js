/**
 * Вспомогательная функция: собирает с роутера все привязки метод+путь → обработчик.
 * Используется в тестах "роут вызывает нужную функцию контроллера".
 *
 * Логика: в Express роутер хранит в stack массив "слоёв" (Layer). У каждого слоя может быть
 * layer.route (тогда это маршрут с методом и путём) или не быть (тогда это middleware).
 * У layer.route есть .path и .methods (объект с ключами get, post и т.д.). Обработчик лежит
 * в layer.route.stack[0].handle. Обходим stack и собираем пары (method, path, handle).
 *
 * @param {import('express').Router} router
 * @returns { Array<{ method: string, path: string, handle: Function }> }
 */
function getRouteBindings(router) {
  const bindings = [];
  for (const layer of router.stack || []) {
    if (!layer.route) continue;
    const path = layer.route.path;
    const methods = layer.route.methods || {};
    const handle = layer.route.stack?.[0]?.handle;
    if (!handle) continue;
    for (const method of Object.keys(methods)) {
      if (methods[method]) bindings.push({ method: method.toLowerCase(), path, handle });
    }
  }
  return bindings;
}

/**
 * Проверяет, что на роутере для заданных method и path зарегистрирован именно handler.
 * path может быть с параметрами, например '/:id' — тогда ищем слой с таким path.
 *
 * @param {import('express').Router} router
 * @param {string} method  'get' | 'post' | 'put' | 'delete'
 * @param {string} path    например '/' или '/:id'
 * @param {Function} expectedHandler  ожидаемая функция-обработчик (тот же reference)
 */
function expectRouteToUse(router, method, path, expectedHandler) {
  const bindings = getRouteBindings(router);
  const m = method.toLowerCase();
  const found = bindings.find((b) => b.method === m && b.path === path);
  expect(found).toBeDefined();
  expect(found.handle).toBe(expectedHandler);
}

module.exports = { getRouteBindings, expectRouteToUse };
