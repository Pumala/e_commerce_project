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

app.factory("EC_Factory", function($http, $cookies, $rootScope) {
  var service = {};
  $rootScope.factoryCookieData = null;
  console.log("Printing initial cookie", $rootScope.factoryCookieData);
  // cookie data gets passed into the factory
  $rootScope.factoryCookieData = $cookies.getObject('cookieData');
  console.log("Printing initial cookie", $rootScope.factoryCookieData);

  console.log("I am inside the factory!");
  if ($rootScope.factoryCookieData) {
    console.log("I am a cookie data in the factory!");
    // grab auth_token from the cookieData
    $rootScope.authToken = $rootScope.factoryCookieData.auth_token;
    // grab user information from cookieData
    $rootScope.user_info = $rootScope.factoryCookieData.user;
  }

  $rootScope.logout = function() {
    console.log("Entered the logout function");
    // remove method => pass in the value of the cookie data you want to remove
    $cookies.remove('cookieData');
    // reset all the scope variables
    $rootScope.factoryCookieData = null;
    $rootScope.authToken = null;
    $rootScope.user_info = null;
  }

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
    })

});

app.controller('SignUpController', function($scope, $stateParams, $state, EC_Factory) {

  $scope.submitSignup = function() {
    console.log("Clicked submit button");
    // store user signup info in a scope object
    $scope.signup_data = {
      username: $scope.username,
      email: $scope.email,
      first_name: $scope.first_name,
      last_name: $scope.last_name,
      password: $scope.password
    }
    console.log("Signup Data is here: ", $scope.signup_data);
    // pass the user signup data object to be processed
    EC_Factory.signup($scope.signup_data)
      .success(function(signup) {
        // console.log("SIGN UP SUCCESS!");
        console.log("signup is: ", signup);
        // redirect to login page for new user to login after being added to db
        $state.go('login');
      })
  }

});

app.controller('LoginController', function($scope, $state, $cookies, $rootScope, EC_Factory, $timeout) {

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
          $cookies.putObject('cookieData', login);
          // store user information in a $rootScope variable
          $rootScope.user_info = login['user'];
          // redirect to home page
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
