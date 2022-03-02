## 浏览器安全-CSRF


### 介绍
cross site request forgery  跨站请求伪造  又有人叫xsrf

> 不能点陌生链接，这句话大部分人都听过。为什么不能点呢？今天就讲解通过跨站请求伪造诈骗的案例。特别是论坛或邮箱，假设论坛有一个转账接口。

1. 在已登录的论坛上面，看到一张美女大图，下面有一个点击下载按键。
2. 用户点击下载，但这个a标签的链接是一个转账接口请求，这样就可以实现转账了。


### DEMO
```shell

# 转账接口
https://www.dev.com/api/transferMoney
# 参数
## 用户
user
## 金额
number
```

```html
<!-- get -->
<body>
  <div>get method demo</div>
  <a href="https://www.dev.com/api/transferMoney?user=xiao&number=100">点击获取资源</a>
  <!-- 不用点击，直接发送请求了 -->
  <img src="https://www.dev.com/api/transferMoney?user=xiao&number=100" />
</body>

<!-- post -->
<body>
  <form id="post-form" method="post" action="https://www.dev.com/api/transferMoney">
    <input value="xiao" name="user" hidden />
    <input value="100" name="number" hidden />
  </form>
</body>
<script>
  document.getElementById('post-form').submit();
</script>

```
### 小结
> CSRF 攻击就是黑客利用了用户的登录状态，并通过第三方的站点来做一些坏事 - -! 

综上所述，满足三个必要条件就可以发动csrf攻击

1. 目标站点要有csrf漏洞
2. 用户登录过目标站点，浏览器保留登录状态
3. 用户打开黑客的链接

### 防护 

1. cookie 设置sameSite    strict  lax none
2. 服务端验证 Referer  origin   origin只是域名  referer全url
3. 添加csrfToken  form表单添加一项，服务端给浏览器端生成一个token 提交要再校验。
```html
<!-- post -->
<body>
  <form id="post-form" method="post" action="https://www.dev.com/api/transferMoney">
    <input value="xxxxxxx" name="csrfToken" hidden />
    <input value="xiao" name="user" hidden />
    <input value="100" name="number" hidden />
  </form>
</body>
<script>
  document.getElementById('post-form').submit();
</script>

> 常用的axios库，可以设计xsrfTokenName   xsrfHeaderName
