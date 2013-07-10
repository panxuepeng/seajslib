seajs.use('../src/md5', function( md5 ){
	module('name', {
	
	});

	test('md5(hello) === 5d41402abc4b2a76b9719d911017c592', function() {
		expect(1);
		strictEqual('5d41402abc4b2a76b9719d911017c592', md5('hello'), '===');
	});
});
/*
======== A Handy Little QUnit Reference ========
http://api.qunitjs.com/

Test methods:
  module(name, {[setup][ ,teardown]})
  test(name, callback)
  expect(numberOfAssertions)
  stop(increment)
  start(decrement)
Test assertions:
  ok(value, [message])
  equal(actual, expected, [message])
  notEqual(actual, expected, [message])
  deepEqual(actual, expected, [message])
  notDeepEqual(actual, expected, [message])
  strictEqual(actual, expected, [message])
  notStrictEqual(actual, expected, [message])
  throws(block, [expected], [message])
*/