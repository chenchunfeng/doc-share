### js-this
js中的this可以翻译为"被调用对象"的意思。

> 调用栈  如果使用js代码里面使用debugger chrome devtools 里面可能看到 call stack列表
```javascript

  function ba() {
    // 调用栈 ba 
    console.log('ba');
    bb();
  }

  function bb() {
    // 调用栈 ba -> bb
    console.log('bb')
    bc()
  }

  function bc() {
    // 调用栈 ba ->  bb -> bc
  }
```

this的绑定可分为 隐式绑定 显示绑定

#### 隐藏绑定
```javascript
// 全局对象window
function foo() {
  console.log(this.a)
}

const obj = {
  a: 1,
  foo: foo
}

var a = 'global';  // 这里需要注意let const 全局下不会挂在window上

obj.foo() // 1
foo() // global
```

还有种绑定丢失的情况，回调函数中容易出现
```javascript
function execute(fn) {
  var test = 'execute'
  fn()
}

function foo() {
  var test = 'foo'
  console.log(this.test)
}

var test = 'global';

execute(foo) // global


// setTimeout 往往也是这个问题
setTimeout(foo)  // global

```

#### 显示绑定

- Function.prototype.call()   -> function.call(thisArg, arg1, arg2, ...)
- Function.prototype.apply()   func.apply(thisArg, [argsArray])
>它们只有一个区别，就是 call() 方法接受的是一个参数列表，而 apply() 方法接受的是一个包含多个参数的数组。

**应该场景**
1. 创建包裹函数，负责接收参数并返回结果
```javascript
function foo(something) {
  console.log(this.a, something)
  return this.a + something
}

var bar = function() {
  // 支持伪数组arguments
  return foo.apply(obj, arguments)
}

const obj = {
  a: 1
}

var bbq = bar(10); // 1, 10
console.log(bbq) // 11
```  
2. 创建重复使用的辅助函数  bind/柯里化函数
```javascript
// bind

function bind(fn, obj) {
  return function() {
    return fn.apply(obj, arguments)
  }
}

function foo(something) {
  console.log(this.a, something)
  return this.a + something
}
const obj = {
  a: 1
}
const bindFn = bind(foo, obj);
var bbq = bindFn(10)  // 1, 10
console.log(bbq) // 11


// 柯里化函数 第一个为函数，剩下的为其它参数。主要就是利用闭合
function currying(fn,...rest1){
	return function(...rest2){
		//这里用apply 是为把数组形式的参数直接传入原函数 null是因为不需要改变this
		return fn.apply(null,rest1.concat(rest2));
	}
}

// 1. 参数复用
function say(name,some){
	console.log(name + '说' + some);
}
let ccfSay = currying(say,'ccf');
ccfSay('1111'); 
ccfSay('222'); 
// 2 延迟执行，通过判断参数长度决定是否执行 add(1)(2,3)(4)();//10

function currying(fn,...rest1){
  let params = []
	return function cb(...rest2){
    if (rest2.length) {
      params = params.concat(rest2)
      return cb;
    }

		return fn.apply(null,rest1.concat(params));
	}
}
function add() {
  let sum = 0
   Array.from(arguments).forEach(item => {
  sum += item
  })
  console.log(sum)
}

const curryingAdd = currying(add);
curryingAdd(1)(2,3)(4)();//10

```

#### new绑定

new（带参数列表） 跟优化级跟成员访问一样（.） 从左往右  new fn().a   -> result = new fn()  result.a
new fn.a  会先a = fn.a   new a;


1. 创建一个新对象。
2. 函数的prototype 指向新对象，新对象.construct 指向函数。
3. 新对象绑定到函数调用的this。
4. 函数如果返回不是对象，即返回这个新对象this。

```javascript
function foo() {
  this.hello = 'bbq';
}

const fooNew = new foo();
console.log(fooNew.hello)
```
 
 #### 软绑定

使用硬绑定bind之后，默认绑定依然有效 缓存原有默认绑定规则吗
```javascript

function softBind(fn) {

}

```


 #### 优化级

 1. new 绑定
 2. call apply
 3. 调用绑定
 4. 默认绑定
