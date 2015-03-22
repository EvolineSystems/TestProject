var app = angular.module('app');

function TestController($scope) {
  'use strict';
  var me = this;

  me.submit = function (name) {
    alert('Hello ' + name);
  };
}
app.controller('TestController', ['$scope', TestController]);
