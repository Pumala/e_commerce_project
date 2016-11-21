var app = angular.module('e_commerce_app', ['ui.router', 'ngCookies'])

app.factory('Flash', function($rootScope, $timeout) {
  function setMessage(message) {
    $rootScope.flashMessage = message;
    $timeout(function() {
      $rootScope.flashMessage = null;
    }, 5000);
  }

  return {
    setMessage: setMessage

  };

  // Service is called like This
  // flash.setMessage("Welcome " + somethingFromDatabase + "!");
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

  service.product_details = function(product_id) {
    var url = '/api/product/' + product_id;
    return $http({
      method: "GET",
      url: url
    })
  }

  service.signup = function(signup_data) {
    var url = '/api/user/signup';
    return $http({
      method: 'POST',
      url: url,
      data: {
        username: signup_data.username,
        email: signup_data.email,
        first_name: signup_data.first_name,
        last_name: signup_data.last_name,
        password: signup_data.password
      }
    })
  }

  service.login = function(login_data) {
    var url = '/api/user/login';
    return $http({
      method: 'POST',
      url: url,
      data: {
        username: login_data.username,
        password: login_data.password
      }
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

app.controller('ProductDetailsController', function($scope, $stateParams, $state, EC_Factory) {
  $scope.product_id = $stateParams.product_id;

  EC_Factory.product_details($scope.product_id)
    .success(function(product_details) {
      console.log("Product details: ", product_details);
      console.log("Product details Name: ", product_details.name);
      $scope.product_details = product_details;
      // $state.go('product_details', { product_id: $scope.product_id })
    })

});

app.controller('SignUpController', function($scope, $stateParams, $state, EC_Factory) {

  $scope.submitSignup = function() {
    console.log("Clicked submit button");
    $scope.signup_data = {
      username: $scope.username,
      email: $scope.email,
      first_name: $scope.first_name,
      last_name: $scope.last_name,
      password: $scope.password
    }
    console.log("Signup Data is here: ", $scope.signup_data);
    EC_Factory.signup($scope.signup_data)
      .success(function(signup) {
        // console.log("SIGN UP SUCCESS!");
        console.log("signup is: ", signup);
        $state.go('login');
      })
  }

});

app.controller('LoginController', function($scope, $state, $cookies, EC_Factory, $timeout) {

  $scope.submitLogin = function() {
    login_data = {
      username: $scope.username,
      password: $scope.password
    }
    EC_Factory.login(login_data)
      .success(function(login) {
        console.log("LOGIN DATA", login);
        if (login.status === 401) {
          console.log('HUGE FAIL!');
          $scope.is_login = true;
          $timeout(function() {
            $scope.is_login = false;
          }, 5000);
        } else {
          // store the successful returned response (user data) inside of a cookie
          $cookies.putObject('cookieDate', login);
          console.log($cookies.putObject);
          // $cookie.putObject = ('token', login.auth_token);
          $state.go('home');
        }
      });
  }

});

app.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
  .state({
    name: 'home',
    url: '/',
    templateUrl: 'home.html',
    controller: 'HomeController'
  })
  .state({
    name: 'product_details',
    url: '/product_details/{product_id}',
    templateUrl: 'product_details.html',
    controller: 'ProductDetailsController'
  })
  .state({
    name: 'signup',
    url: '/signup',
    templateUrl: 'signup.html',
    controller: 'SignUpController'
  })
  .state({
    name: 'login',
    url: '/login',
    templateUrl: 'login.html',
    controller: 'LoginController'
  })

  $urlRouterProvider.otherwise('/');

});
