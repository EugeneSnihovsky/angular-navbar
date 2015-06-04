'use strict';

(function () {
    angular.module('navbar')
        .factory('navPermission', function (Permission, $q) {
// перебираем все роли и возвращаем подходящую в виде промиса
            function getUser(params) {
                var users = Permission.roleValidations,
                    names = Object.keys(users),
                    promisesArr = [];

                for(var i = 0; i < names.length; i++) {
                    var current = names[i],
                        validUser = $q.when( users[current](params) );
                    promisesArr.push(validUser);
                }

                return $q.all(promisesArr).then(function (users) {
                   for(var i = 0; i < users.length; i++) {
                       if(users[i]) {
                           return names[i];
                       }
                   }
                    return null;
                });
            }
// если пришел промис, ждем его разрешения и меняем меню, если пользователь - сразу меняем меню
            function acceptPermission (list, username) {
                if(!username.then) {
                    return changeList(list, username);
                } else {
                    return username.then(function (username) {
                        return changeList(list, username);
                    });
                }
            }
// рекурсивно пробегаемся по массиву меню и удаляем пункты, которые запрещены для текущей роли
            function changeList(list, username) {
                for(var i = (list[0].name) ? 0 : 1; i < list.length; i++) {
                    if(list[i].permissions) {
                        if(list[i].permissions.except) {
                            var except = list[i].permissions.except;

                            for(var j = 0; j < except.length; j++) {
                                if(except[j] === username) {
                                    list.splice(i--, 1);
                                }
                            }
                        } else if(list[i].permissions.only) {
                            var only = list[i].permissions.only,
                                accessDenided = true;

                            for(j = 0; j < only.length; j++) {
                                if(only[j] === username) {
                                    accessDenided = false;
                                }
                            }
                            if(accessDenided) {
                                list.splice(i--, 1);
                            }
                        }
                    } else if(list[i].name.pop) {
                        list[i].name = changeList( list[i].name, username);
                        if(list[i].name.length === 1 ) {
                            list.splice(i--, 1);
                        }
                    }
                }

                return list;
            }
// возвращаем созданные методы фабрики
            return {
                getUser: getUser,
                acceptPermission: acceptPermission
            };
        });
})();