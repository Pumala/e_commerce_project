var app = angular.module('e_commerce_app', ['ui.router'])

app.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
  .state({
    name: 'home',
    url: '/',
    templateUrl: 'home.html',
    controller: 'HomeController'
  })

  $urlRouterProvider.otherwise('/');

});

app.factory("EC_Factory", function($http) {
  var service = {};

  service.listAllProducts = function() {
    var url = '/api/products';
    return $http({
      method: "GET",
      url: url
    })
  }

  return service;

});

app.controller('HomeController', function($scope, EC_Factory) {

  EC_Factory.listAllProducts()
    .success(function(all_products) {
      $scope.all_products = all_products;
      console.log("Listing all products: ", all_products);
    })

});
