'use strict';

(function() {
    angular.module('navbar')
        .config(function ($stateProvider, navbarListProvider) {
// добавляем в метод state функционал регистрации пунктов меню
            $stateProvider.decorator('state', function (obj) {
                var menu = obj.menu,
                    permissions = (obj.data) ? obj.data.permissions : null;
// если в коде не указана регистрация текущего стейта в меню - ничего не делаем
                if(!menu) {
                    return;
                }
                menu.state = obj.name;
// регистрируем права доступа пункта при их наличии
                if(permissions) {
                    menu.permissions = {};
                    if(permissions.except) {
                        menu.permissions.except = permissions.except;
                    } else if(permissions.only) {
                        menu.permissions.only = permissions.only;
                    } else {
                        delete menu.permissions;
                    }
                }
// регистрируем пункт меню по скомпонованному объекту menu
                navbarListProvider.add(menu);
            });
        });
})();
