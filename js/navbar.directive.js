'use strict';

(function () {
    angular.module('navbar')
        .directive('navbar', function ($document, $state, navbarList, navPermission) {
            return {
                restrict: 'A',
                scope: {
                    name: '@',
                    sref: '@'
                },
                templateUrl: '/components/angular-navbar/html/navbar.template.html',
                link: function (scope, elem) {
                    var openedMenu = null,
                        openedSubMenu = null,
                        username = navPermission.getUser($state.params);
// присваиваем нашему DOM элементу необходимые классы и атрибуты для работы bootstrap
                    elem.addClass('navbar navbar-inverse navbar-fixed-top');
                    elem.attr('role', 'navigation');
// редактируем список пунктов меню в соотвествии с доступом и передаем его в scope директивы
                    if(username) {
                        navPermission.acceptPermission(navbarList.list, username);
                    }
                    scope.navbar = navbarList.list;
// открытие/сокрытие меню на телефонах или при узком экране браузера
                    scope.collapseMenu = function ($event) {
                        var navbar = elem.find('#navbar'),
                            expanded = navbar.hasClass('in');

                        navbar.attr('aria-expanded', !expanded);
                        scope.navCollapsed = (expanded) ? '' : 'in';

                        closeAllMenu();
                        stopBubleAndPropagation($event);
                    };
// присвоение класса активного пункта меню соответствующей страницы и класса подменю, если пункт содержит подпункты
                    scope.menuClass = function (item, level) {
                        var status = false,
                            activePage = getActivePage($state.current.name),
                            currentPage = (item.pop) ? item[0] : item,
                            classList = (level === 'firstLevel') ? 'dropdown dropdown-firstLevel ' :
                                'menu-item dropdown dropdown-submenu ',
                            activeClass = (currentPage === activePage || isActive(item, activePage, status) ) ?
                                'menu-active' : '';

                        if(item.pop) {
                            return classList + activeClass;
                        } else {
                            return activeClass;
                        }
                    };
// получение имени активного пункта меню в соответствии с открытой страницей (состоянием)
                    function getActivePage(state, currentList) {
                        var name;

                        if(!currentList) {
                            currentList = scope.navbar;
                        }

                        for(var i = (currentList[0].name) ? 0 : 1; i < currentList.length; i++) {
                            if(currentList[i].state === state) {
                                return currentList[i].name;
                            } else if(currentList[i].name.pop) {
                                name = getActivePage(state, currentList[i].name);
                            }
                        }
                        return name;
                    }
// проверка, является ли пункт меню активным
                    function isActive (item, activePage, status) {
                        if(item.pop) {
                            for(var i = 1; i < item.length; i++) {
                                if(item[i].name.pop) {
                                    status = isActive(item[i].name, activePage, status);
                                } else if(item[i].name === activePage) {
                                    return true;
                                }
                            }
                        } else if(item === activePage) {
                            return true;
                        }
                        return status;
                    }
// раскрытие сокрытие подпунктов меню по кликку или наведению мыши (страшная функция, т.к. учтены варианты разного разрешения экрана)
                    scope.expandMenu = function ($event) {
                        var clickedElem = $($event.currentTarget),
                            parentClicked = $($event.currentTarget.parentElement),
                            expanded = clickedElem.attr('aria-expanded'),
                            isOpened = parentClicked.hasClass('open'),
                            attrExpanded = (expanded === 'false'),
                            allOpenedMenu = parentClicked.parent().find('.open'),
                            smallWindow = window.innerWidth < 768,
                            eventMouseEnter = $event.type === 'mouseenter',
                            subMenuAll = elem.find('.dropdown-submenu');

                        if(!smallWindow || !eventMouseEnter) {
                            allOpenedMenu.removeClass('open');
                            clickedElem.attr('aria-expanded', attrExpanded);

                            if(isOpened && !eventMouseEnter) {
                                parentClicked.removeClass('open');
                            } else {
                                parentClicked.addClass('open');
                                openedMenu = clickedElem; //**
                            }
                        }

                        subMenuAll.removeClass('dropdown-submenu-small dropdown-submenu-big');
                        if(smallWindow) {
                            subMenuAll.addClass('dropdown-submenu-small');
                        } else {
                            subMenuAll.addClass('dropdown-submenu-big');
                        }
                        stopBubleAndPropagation($event);
                    };
// закрытие подменю при наведении на соседний пункт в основном меню
                    scope.closeOnMoveMenu = function () {
                        var smallWindow = window.innerWidth < 768;

                        if(openedMenu && !smallWindow) {
                            var clickedLink = openedMenu,
                                clickedElement = clickedLink.parent();

                            clickedElement.removeClass('open');
                            clickedLink.attr('aria-expanded', false);
                            openedMenu = null;
                        }
                    };
// раскрытие сокрытие подпунктов подменю (аналогично функции с 92 строки)
                    scope.expandSubMenu = function ($event) {
                        var elemClicked = $($event.currentTarget.parentElement),
                            smallWindow = window.innerWidth < 768,
                            eMouseEnter = $event.type === 'mouseenter',
                            sameElement = elemClicked.hasClass('open');

                        if(!smallWindow || !eMouseEnter) { // потом подумать как упростить
                            if(!sameElement && !eMouseEnter || !eMouseEnter || !sameElement) {
                                elemClicked.parent().find('.open').removeClass('open');
                            }
                            if(!sameElement) {
                                elemClicked.addClass('open');
                                openedSubMenu = elemClicked;
                            }
                        }
                        stopBubleAndPropagation($event);
                    };
// закрытие подменю при наведении на соседний подпункт в подменю (звучит то как:))
                    scope.closeOnMoveSubMenu = function ($event) {
                        var smallWindow = window.innerWidth < 768;

                        if(openedSubMenu && !smallWindow) {
                            var clickedElement = openedSubMenu,
                                savedList = clickedElement.parent(),
                                currentList = $($event.target).parent().parent();

                            if(savedList[0] === currentList[0]) {
                                clickedElement.removeClass('open');
                                openedSubMenu = null;
                            }
                        }
                    };

                    scope.closeMenu = closeMenu;
// удаляем всех слушателей с документа при его уничтожении
                    var $body = $document.find('html');
                    elem.bind('$destroy', function() {
                        $body.unbind();  //не хватает проверки на удаленный элемент
                    });
// при клике вне меню - закрываем все открытые позиции
                    $body.bind('click', closeMenu);

                    function closeMenu ($event) {
                        var elemClicked = $event.relatedTarget || $event.target;

                        if(isClickOutNavbar(elemClicked)) {
                            closeAllMenu();
                        }
                    }
// рекурсивно поднимаемся по родителям элемента, чтобы узнать, был клик по меню или нет
                    function isClickOutNavbar(elem) {
                        if($(elem).hasClass('dropdown-firstLevel')) {
                            return false;
                        }

                        if(elem.parentElement !== null) {
                            return isClickOutNavbar(elem.parentElement);
                        } else {
                            return true;
                        }
                    }
// закрываем все открытые пункты и подпункты меню
                    function closeAllMenu() {
                        elem.find('.open').removeClass('open');
                        elem.find('[aria-expanded=true]').attr('aria-expanded', false);
                    }
// служебная функция предотвращения действий браузера поумолчанию и всплывающих событий
                    function stopBubleAndPropagation($event) {
                        $event.stopPropagation();
                        $event.preventDefault();
                    }

                }
            };
        });
})();


// попробовать перенести применение пермишна в секцию рун


// добавить недоступный курсор при наведении на уже нажатую ссылку в меню
// втулить $ jQuery зависимость в директиву, чтобы не подключать его
// разбить сложную функцию клик+онмове, на две простые


// сделать выбор через || откуда брать массив меню, из скоупа или из провайдера

// попробовать прикрутить анимацию загрузки на каждую страницу в пунктах меню

// отсортировать функции, моусемов + онклик + другие



// сайт пункт хитрости ангуляра и js