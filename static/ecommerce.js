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
    });
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

  service.listAllProducts = function() {
    var url = '/api/products';
    return $http({
      method: "GET",
      url: url
    });
  }

  service.product_details = function(product_id) {
    var url = '/api/product/' + product_id;
    return $http({
      method: "GET",
      url: url
    });
  }

  service.addToCart = function(product_id) {
    var addToCart = 'Add';
    var url = '/api/shopping_cart';
    console.log("Token:", $cookies.getObject('cookieData').auth_token);
    console.log("Product ID:", product_id);
    console.log("user info:", $cookies.getObject('cookieData').user["id"]);
    return $http({
      method: "POST",
      url: url,
      data: {
        auth_token: $cookies.getObject('cookieData').auth_token,
        customer_id: $cookies.getObject('cookieData').user["id"],
        product_id: product_id,
        add_remove: addToCart
      }
    });
  }

  service.removeFromCart = function(product_id) {
    var addToCart = 'Remove';
    var url = 'api/shopping_cart';
    console.log("Token:", $cookies.getObject('cookieData').auth_token);
    console.log("Product ID:", product_id);
    console.log("user info:", $cookies.getObject('cookieData').user["id"]);
    return $http({
      method: "POST",
      url: url,
      data: {
        auth_token: $cookies.getObject('cookieData').auth_token,
        customer_id: $cookies.getObject('cookieData').user["id"],
        product_id: product_id,
        add_remove: addToCart
      }
    });
  }

  service.getShoppingCart = function() {
    console.log("Inside service shopping cart");
    console.log("Token:", $cookies.getObject('cookieData').auth_token);
    var url = '/api/shopping_cart';
    return $http({
      method: "GET",
      url: url,
      params: {
        auth_token: $cookies.getObject('cookieData').auth_token
      }
    });
  }

  service.getOrderInfo = function(shippingInfo) {
    var url = '/api/shopping_cart';
    return $http({
      method: "GET",
      url: url,
      params: {
        auth_token: $cookies.getObject('cookieData').auth_token
      }
    });
  }

  service.getCheckout = function(shippingInfo, stripeToken) {
    var url = "/api/shopping_cart/checkout";
    return $http({
      method: "POST",
      url: url,
      data: {
        auth_token: $cookies.getObject('cookieData').auth_token,
        shipping_info: shippingInfo,
        stripe_token: stripeToken
      }
    });
  }

  // service.checkoutAPI = function(stripeToken) {
  //   var url = ""
  // }

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

  $scope.addProduct  = function(product_id) {
    EC_Factory.addToCart(product_id)
      .success(function(addedToCart) {
        console.log(addedToCart);
      });
  }

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
    $scope.login_data = {
      username: $scope.username,
      password: $scope.password
    };
    EC_Factory.login($scope.login_data)
      // console.log("LOGIN DATA:", data);
      .success(function(login) {
        console.log("LOGIN DATA:", login);
        // store the successful returned response (user data) inside of a cookie
        $cookies.putObject('cookieData', login);
        // store user information in a $rootScope variable
        $rootScope.user_info = login['user'];
        // store token information in a $rootScope variable
        $rootScope.authToken = login['auth_token'];
        // redirect to home page
        $state.go('home');
        console.log("LOGIN DATA", login);
      })
      .error(function() {
        // if (login.status === 401) {
        console.log('HUGE FAIL!');
        $scope.is_login = true;
        $timeout(function() {
          $scope.is_login = false;
        }, 5000);
        // }
      });
  }


  // $scope.submitLogin = function() {
  //   $scope.login_data = {
  //     username: $scope.username,
  //     password: $scope.password
  //   }
  //   EC_Factory.login($scope.login_data)
  //     .success(function(login) {
  //       console.log("LOGIN DATA", login);
  //       if (login.status === 401) {
  //         console.log('HUGE FAIL!');
  //         $scope.is_login = true;
  //         $timeout(function() {
  //           $scope.is_login = false;
  //         }, 5000);
  //       } else {
  //         // store the successful returned response (user data) inside of a cookie
  //         $cookies.putObject('cookieData', login);
  //         // store user information in a $rootScope variable
  //         $rootScope.user_info = login['user'];
  //         // store token information in a $rootScope variable
  //         $rootScope.authToken = login['auth_token'];
  //         // redirect to home page
  //         $state.go('home');
  //       }
  //     });
  // }

});

app.controller('ShoppingCartController', function($scope, $state, $cookies, $rootScope, EC_Factory) {

  $scope.removeItem = function(product_id) {
    console.log("LETS REMOVE ME!!");
    EC_Factory.removeFromCart(product_id)
      .success(function(deletedMessage) {
        // reload the page
        $state.reload();
      });
  }

  EC_Factory.getShoppingCart()
    .success(function(shopping_cart) {
      console.log(shopping_cart);
      console.log("shopping_cart");
      $scope.shopping_cart = shopping_cart.shopping_cart_products;
      $scope.total_price = shopping_cart.total_price;
    });
});

app.controller('CheckoutController', function($scope, $state, $cookies, $rootScope, EC_Factory) {

  EC_Factory.getOrderInfo($scope.shipping_info)
    .success(function(shopping_cart) {
      console.log("We checked out!");
      $scope.shopping_cart = shopping_cart.shopping_cart_products;
      $scope.total_price = shopping_cart.total_price
    });

    $scope.paymentCheckout = function() {
      console.log("FIRST PART:    ....")
      // initialize $scope.address_line_2 to nothing otherwise it will be sent as undefined and this will cause an issue when trying to insert information into the database
      $scope.address_line_2 = ""
      $scope.shipping_info = {
        address: $scope.address,
        address_line_2: $scope.address_line_2,
        city: $scope.city,
        state: $scope.state,
        zip_code: $scope.zip_code,
      };
      var amount = $scope.total_price;
      var handler = StripeCheckout.configure({
        // publishable key
        key: 'pk_test_6ejpZxH0HdamRL9OQ2JymyQB',
        locale: 'auto',
        token: function callback(token) {
          console.log("STRIPE TOKEN", token)
          var stripeToken = token.id;
          // Make checkout API call here and send the stripe token
          // to the back end
          EC_Factory.getCheckout($scope.shipping_info, token)
            .success(function(shopping_cart) {
              console.log("We checked out and are going to the thank you page!");
              $state.go('thanks');
            });
        }
      });
        // this actually opens the popup modal dialog
      handler.open({
        name: 'My awesome store',
        description: 'Some magazines',
        amount: amount * 100
      });
    };

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
  .state({
    name: 'shopping_cart',
    url: '/shopping_cart',
    templateUrl: 'shopping_cart.html',
    controller: 'ShoppingCartController'
  })
  .state({
    name: 'checkout',
    url: '/checkout',
    templateUrl: 'checkout.html',
    controller: 'CheckoutController'
  })
  .state({
    name: 'thanks',
    url: '/thanks',
    templateUrl: 'thanks.html'
  })

  $urlRouterProvider.otherwise('/');

});
