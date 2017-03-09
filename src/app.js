/**
 * Created by lykovartem on 2/16/2017.
 */

angular.module('myApp', [
    'ui.router',
    'ngAnimate',
    'ui.bootstrap'
])
    .factory('sharedService', ['$filter', function ($filter) {
        let sharedService = {
            showTasksByState: function (selectedState = 'all') {

                let tasksByState = $filter('filter')(sharedService.todos,
                    item => {
                        return selectedState == 'all' ? item : item.taskState == selectedState
                    });

                let selectedTitle = sharedService.states.find(item => {
                    return item.state == selectedState
                });

                sharedService.tasksToShow = {
                    header: selectedTitle ? selectedTitle.title : "All",
                    data: tasksByState
                };

                sharedService.selectedState = selectedState;
            },
            isLoggedIn: false
        };
        return sharedService;
    }])
    .factory('dataService', ['$http', '$q', function ($http, $q) {
        return {
            getTasksAndStates: function () {
                return $q.all([
                    $http.get('./api/all-tasks'),
                    $http.get('./data/states.json')
                ]);
            },
            addNewTask: function (task) {
                return $http.post('/api/create-task', task);
            },
            editTask: function (task) {
                return $http.put(`/api/update-task/${task._id}`, task);
            },
            deleteTask: function (task) {
                return $http.delete(`/api/delete-task/${task._id}`, task);
            }
        }
    }])
    .factory('AuthenticationService', ['$http',
        function ($http) {
            return {
                login: function (username, password, callback) {
                    $http.post('/api/log-in', {username, password})
                        .then(res => {
                            if (callback) {
                                callback(res)
                            }
                        })
                },
                register: function (username, password, callback) {
                    $http.post('/api/register', {username, password})
                        .then(res => {
                            if (callback) {
                                callback(res)
                            }
                        })
                }
            }
        }])
    .config(['$stateProvider', '$urlRouterProvider',
        function ($stateProvider, $urlRouterProvider) {
            let listState = {
                name: 'list',
                url: '/',
                template: require('./components/list/list-template.html'),
                controller: 'ListController'
            };

            let inputState = {
                name: 'list.addNew',
                url: 'addnew',
                sticky: true,
                views: {
                    'addNew': {
                        template: require('./components/input/input-template.html'),
                        controller: 'InputController'
                    }
                }
            };

            let authState = {
                name: 'auth',
                url: '/auth',
                template: require('./components/auth/auth-template.html'),
                controller: 'AuthController'
            };

            $stateProvider.state(listState);
            $stateProvider.state(inputState);
            $stateProvider.state(authState);

            $urlRouterProvider.otherwise('/');
        }])
    .run(['$state', 'sharedService',
        function ($state, sharedService) {
            if (!sharedService.isLoggedIn) $state.go('auth')
        }]);
