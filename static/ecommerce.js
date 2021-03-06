var app = angular.module('e_commerce_app', ['ui.router', 'ngCookies'])

// app.factory('Flash', function($rootScope, $timeout) {
//   function setMessage(message) {
//     $rootScope.flashMessage = message;
//     $timeout(function() {
//       $rootScope.flashMessage = null;
//     }, 5000);
//   }
//
//   return {
//     setMessage: setMessage
//
//   };
//
//   // Service is called like This
//   // flash.setMessage("Welcome " + somethingFromDatabase + "!");
// });

app.factory("EC_Factory", function($http, $cookies, $rootScope) {

  // create a service object that stores all the methods
  var service = {};

  $rootScope.factoryCookieData = null;

  // cookie data is stored into the factory as a global rootScope variable
  $rootScope.factoryCookieData = $cookies.getObject('cookieData');

  // check if a user is logged in by seeing if the cookieData is storing the user's data
  // good to have when page has been refreshed, saves the user's info and does not log them out
  if ($rootScope.factoryCookieData) {
    // grab auth_token from the cookieData
    $rootScope.authToken = $rootScope.factoryCookieData.auth_token;
    // grab user information from cookieData
    $rootScope.user_info = $rootScope.factoryCookieData.user;
  }

  $rootScope.logout = function() {
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

  service.updateCart = function(product_id, add_or_delete) {
    // add_or_delete is a string value of either 'Add' or 'Delete'
    // the back-end will either add or delete the item depending on this value
    var url = '/api/shopping_cart';

    return $http({
      method: "POST",
      url: url,
      data: {
        auth_token: $cookies.getObject('cookieData').auth_token,
        customer_id: $cookies.getObject('cookieData').user["id"],
        product_id: product_id,
        add_remove: add_or_delete
      }
    });
  }

  // service.addToCart = function(product_id) {
  //   var addToCart = 'Add';
  //   var url = '/api/shopping_cart';
  //   console.log("Token:", $cookies.getObject('cookieData').auth_token);
  //   console.log("Product ID:", product_id);
  //   console.log("user info:", $cookies.getObject('cookieData').user["id"]);
  //   return $http({
  //     method: "POST",
  //     url: url,
  //     data: {
  //       auth_token: $cookies.getObject('cookieData').auth_token,
  //       customer_id: $cookies.getObject('cookieData').user["id"],
  //       product_id: product_id,
  //       add_remove: addToCart
  //     }
  //   });
  // }
  //
  // service.removeFromCart = function(product_id) {
  //   var addToCart = 'Remove';
  //   var url = 'api/shopping_cart';
  //   console.log("Token:", $cookies.getObject('cookieData').auth_token);
  //   console.log("Product ID:", product_id);
  //   console.log("user info:", $cookies.getObject('cookieData').user["id"]);
  //   return $http({
  //     method: "POST",
  //     url: url,
  //     data: {
  //       auth_token: $cookies.getObject('cookieData').auth_token,
  //       customer_id: $cookies.getObject('cookieData').user["id"],
  //       product_id: product_id,
  //       add_remove: addToCart
  //     }
  //   });
  // }

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

app.controller('ProductDetailsController', function($scope, $stateParams, $state, EC_Factory, $timeout) {
  $scope.product_id = $stateParams.product_id;
  $scope.addProductBtn = "Add to Cart!";
  $scope.added = false;

  console.log("ADD ME:", $scope.addProductBtn);
  console.log("ADD ME BUTTON:", $scope.added);

  EC_Factory.product_details($scope.product_id)
    .success(function(product_details) {
      console.log("Product details: ", product_details);
      console.log("Product details Name: ", product_details.name);
      $scope.product_details = product_details;
    })

  $scope.addProduct  = function(product_id) {
    EC_Factory.updateCart(product_id, 'Add')
      .success(function(addedToCart) {
        $scope.addProductBtn = "Added!";
        $scope.added = true;
        // $scope.addProductBtn.addClassList('timeoutHover');
        $timeout(function() {
          $scope.addProductBtn = "Add to Cart!";
          $scope.added = false;
          // $scope.addProductBtn.removeClassList('timeoutHover');
        }, 3000);
      });
  }

});

app.controller('SignUpController', function($scope, $timeout, $stateParams, $state, EC_Factory) {

  $scope.submitSignup = function() {
    console.log("Clicked submit button");
    // check if password matches confirm_password
    if ($scope.password !== $scope.confirm_password) {
      // $timeout(function() {
      //   console.log("Hello");
      // }, 3000);
      return;
    }
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
        // console.log(login['status']);
        if (login['status']) {
          console.log('HUGE FAIL!');
          $scope.is_login = true;
          $timeout(function() {
            $scope.is_login = false;
          }, 5000);
        } else {
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
        }
        // console.log("LOGIN DATA:", login);
        // // store the successful returned response (user data) inside of a cookie
        // $cookies.putObject('cookieData', login);
        // // store user information in a $rootScope variable
        // $rootScope.user_info = login['user'];
        // // store token information in a $rootScope variable
        // $rootScope.authToken = login['auth_token'];
        // // redirect to home page
        // $state.go('home');
        // console.log("LOGIN DATA", login);
      })
      // .error(function() {
        // if (login.status === 401) {
        // console.log('HUGE FAIL!');
        // $scope.is_login = true;
        // $timeout(function() {
        //   $scope.is_login = false;
        // }, 5000);
        // }
      // });
  }


  // $scope.submitLogin = function() {
  //   $scope.login_data = {
  //     username: $scope.username,
  //     password: $scope.password
  //   };
  //   EC_Factory.login($scope.login_data)
  //     // console.log("LOGIN DATA:", data);
  //     .success(function(login) {
  //       // console.log(login['status']);
  //       // if (login['status'])
  //       console.log("LOGIN DATA:", login);
  //       // store the successful returned response (user data) inside of a cookie
  //       $cookies.putObject('cookieData', login);
  //       // store user information in a $rootScope variable
  //       $rootScope.user_info = login['user'];
  //       // store token information in a $rootScope variable
  //       $rootScope.authToken = login['auth_token'];
  //       // redirect to home page
  //       $state.go('home');
  //       console.log("LOGIN DATA", login);
  //     })
  //     .error(function() {
  //       // if (login.status === 401) {
  //       console.log('HUGE FAIL!');
  //       $scope.is_login = true;
  //       $timeout(function() {
  //         $scope.is_login = false;
  //       }, 5000);
  //       // }
  //     });
  // }

});

app.controller('ShoppingCartController', function($scope, $state, $cookies, $rootScope, EC_Factory) {

  $scope.removeItem = function(product_id) {
    EC_Factory.updateCart(product_id, 'Remove')
      .success(function(deletedMessage) {
        // reload the page
        $state.reload();
      });
  }

  EC_Factory.getShoppingCart()
    .success(function(shopping_cart) {
      // upon success, assign return info to scope variables to be used in html pages
      $scope.shopping_cart = shopping_cart.shopping_cart_products;
      $scope.total_price = shopping_cart.total_price;
    });
});

app.controller('CheckoutController', function($scope, $state, $cookies, $rootScope, EC_Factory, $timeout) {

  EC_Factory.getOrderInfo($scope.shipping_info)
    .success(function(shopping_cart) {
      $scope.shopping_cart = shopping_cart.shopping_cart_products;
      $scope.total_price = shopping_cart.total_price
    });

    $scope.paymentCheckout = function() {
      // initialize $scope.address_line_2 to nothing otherwise it will be sent as undefined and this will cause an issue when trying to insert information into the database
      $scope.address_line_2 = ""
      // save user shipping info to an object
      $scope.shipping_info = {
        address: $scope.address,
        address_line_2: $scope.address_line_2,
        city: $scope.city,
        state: $scope.state,
        zip_code: $scope.zip_code,
      };
      // checks if any of the required fields in the shipping info form is undefined
      if ($scope.address === undefined || $scope.city === undefined ||
      $scope.state === undefined || $scope.zip_code === undefined) {
        // if any field is undefined, do not proceed to payment part of checkout
        $scope.continue = false;
        $scope.showMessage = true;
        $timeout(function() {
          $scope.showMessage = false;
        }, 3000);
      } else {
        // if none of the required fields is undefined, continue to payment part of checkout
        $scope.continue = true;
      }
      // continue to payment part of checkout
      if ($scope.continue) {
        var amount = $scope.total_price;
        var handler = StripeCheckout.configure({
          // publishable key
          key: 'pk_test_6ejpZxH0HdamRL9OQ2JymyQB',
          locale: 'auto',
          token: function callback(token) {
            // Make checkout API call here and send the stripe token to the back end
            // the back-end later uses the stripe token id to create a credit card charge
            EC_Factory.getCheckout($scope.shipping_info, token)
              .success(function(shopping_cart) {
                // redirect to thank you page
                $state.go('thanks');
              });
          }
        });
        // this actually opens the popup modal dialog where users can enter payment info
        handler.open({
          name: 'WobblyBobbly',
          description: 'Collect them all - one Bobblehead at a time',
          amount: amount * 100
        });
      }
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
