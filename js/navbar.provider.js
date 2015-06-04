'use strict';

(function () {
    angular.module('navbar')
        .provider('navbarList', function () {
            var list = [];
// основная функция добавления пункта в меню
            this.add = function (obj) {
// проверка на правильно заданные параметры расположения пункта
                if(obj.location) {
                    if(obj.location.place.length !== obj.location.priority.length ||
                        !obj.location.place.pop || !obj.location.priority.pop) {
                        console.log('Warning! Bad location params for menu "' + obj.name + '". Skip item');
                        return;
                    }
                }
// добавление пункта на первый уровень меню при отстутствии местоположения
                if(!obj.location) {
                    var name = obj.name;
                    for(var i = 0; i < list.length; i++) { // рассказать про тернарный оператор и утиную типизацию
                        var currentName = (list[i].name.pop) ? list[i].name[0] : list[i].name;
                        if(currentName === name) {
                            console.log('Warning! Duplicate menu "' + name + '". Skip item');
                            return;
                        }
                    }
                    list.push(obj);
                    list.sort(sortByPriority);
                    return;
                }
// поиск пункта, в который нужно добавить подпункт согласно местоположению
                var place = obj.location.place.shift(),
                    priority = obj.location.priority.shift();

                for(i = 0; i < list.length; i++) { // описать в статье, что i блочная не в JS
                    var currentSubName = (list[i].name.pop) ? list[i].name[0] : null;
                    if(place === currentSubName) {
                        list[i].name = changeExistPart(obj, list[i].name);
                        if(priority !== list[i].priority) {
                            console.log('Warning! Priority of menu "' + list[i].name + '" has been changed from "' +
                                list[i].priority + '" to "' + priority + '"');
                            list[i].priority = priority;
                            list.sort(sortByPriority);
                        }
                        return;
                    }
                    currentName = list[i].name;
                    if(place === currentName) {
                        console.log('Warning! Duplicate submenu "' + place + '". Skip item');
                        return;
                    }
                }
// ни одно вышеописанное условие не совпало, добавляем новый пункт со всеми вложениями
                list.push( {
                    name: [place, makeOriginalPart(obj)],
                    priority: priority
                } );
                list.sort(sortByPriority);
            };
// рекурсивный поиск места в подпунктах меню для вставки нового пункта
            function changeExistPart(obj, list) {
                var place = obj.location.place.shift(),
                    priority = obj.location.priority.shift(), //  возможно необходимо сделать двойной приоритет
                    searchName = (place) ? place : obj.name;

                for(var i = 1; i < list.length; i++) {
                    var currentName = (list[i].name.pop) ? list[i].name[0] : list[i].name;
                    if(searchName === currentName) {
                        if(!list[i].name.pop || (!place && list[i].name.pop) ) {
                            console.log('Warning! Duplicate menu "' + searchName + '". Skip item');
                            return list;
                        } else {
                            list[i].name = changeExistPart(obj, list[i].name);
                            if(priority !== list[i].priority) {
                                console.log('Warning! Priority of menu "' + list[i].name +
                                    '" has been changed from "' + list[i].priority + '" to "' + priority + '"');
                                list[i].priority = priority;
                                list.sort(sortByPriority);
                            }
                            return list;
                        }
                    }
                }
                if(!place) {
                    delete obj.location;
                    list.push(obj);
                } else {
                    list.push({
                        name: [place, makeOriginalPart(obj)],
                        priority: priority
                    });
                }
                list.sort(sortByPriority);
                return list;
            }
// рекурсивное создание новой, оригинальной части пункта меню с подпунктами
            function makeOriginalPart (obj) {
                var place = obj.location.place.shift(),
                    priority = obj.location.priority.shift();

                if(place) {
                    var menu = {
                        priority: priority,
                        name: [place, makeOriginalPart(obj)]
                    };
                } else {
                    delete obj.location;
                    menu = obj;
                }
                return menu;
            }
// функция сортировки пунктов меню по приоритету
            function sortByPriority(a, b) {
                return a.priority - b.priority;
            }
// служебная функция для работы провайдера angularJS
            this.$get = function () {
                return {
                    list: list,
                    add: this.add
                };
            };
        });
})();

// сделать проверку на повторение стейтов в меню. Пушаем их все в один массив и прогоняем на совпадение
