# 请求 Mock

拦截、模拟、修改和阻止网络请求。

## CLI Route 命令

```bash
# 使用自定义状态码模拟
playwright-cli route "**/*.jpg" --status=404

# 使用 JSON 响应体模拟
playwright-cli route "**/api/users" --body='[{"id":1,"name":"Alice"}]' --content-type=application/json

# 使用自定义请求头模拟
playwright-cli route "**/api/data" --body='{"ok":true}' --header="X-Custom: value"

# 移除请求中的请求头
playwright-cli route "**/*" --remove-header=cookie,authorization

# 列出活跃的路由
playwright-cli route-list

# 删除一条或所有路由
playwright-cli unroute "**/*.jpg"
playwright-cli unroute
```

## URL 模式

```
**/api/users           - 精确路径匹配
**/api/*/details       - 路径中的通配符
**/*.{png,jpg,jpeg}    - 匹配文件扩展名
**/search?q=*          - 匹配查询参数
```

## 使用 run-code 进行高级 Mock

用于条件响应、请求体检查、响应修改或延迟：

### 基于请求的条件响应

```bash
playwright-cli run-code "async page => {
  await page.route('**/api/login', route => {
    const body = route.request().postDataJSON();
    if (body.username === 'admin') {
      route.fulfill({ body: JSON.stringify({ token: 'mock-token' }) });
    } else {
      route.fulfill({ status: 401, body: JSON.stringify({ error: '无效请求' }) });
    }
  });
}"
```

### 修改真实响应

```bash
playwright-cli run-code "async page => {
  await page.route('**/api/user', async route => {
    const response = await route.fetch();
    const json = await response.json();
    json.isPremium = true;
    await route.fulfill({ response, json });
  });
}"
```

### 模拟网络故障

```bash
playwright-cli run-code "async page => {
  await page.route('**/api/offline', route => route.abort('internetdisconnected'));
}"
# 可选值：connectionrefused、timedout、connectionreset、internetdisconnected
```

### 延迟响应

```bash
playwright-cli run-code "async page => {
  await page.route('**/api/slow', async route => {
    await new Promise(r => setTimeout(r, 3000));
    route.fulfill({ body: JSON.stringify({ data: 'loaded' }) });
  });
}"
```
