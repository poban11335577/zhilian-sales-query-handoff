# 节点及变量绑定

以下变量名中，节点名称是人工命名；引用应使用平台变量选择器实际选择，避免把路径作为固定字符串。

| 节点 | 配置 |
|---|---|
| 开始 | rawQuery：string，用户完整问题 |
| 解析查询条件 | 大模型调用，输入 rawQuery 引用开始.rawQuery；系统和用户提示词见 prompts/ |
| 解析查询JSON | 执行代码块，输入 jsonText 引用解析查询条件.output；粘贴 src/parse-query.js |
| 查询条件分支 | 上方使用引用：解析查询JSON.queryStatus；运算符：等于；下方固定输入：ready |
| 条件不足回复 | 输出解析查询JSON.clarification，再结束本次运行 |
| 销售数据查询 API | 选择 zhilian_sales_summary；入参见 docs/API.md |
| API 成功判断 | 使用 API.success 的布尔值判断；不要与字符串 true 混淆 |
| 成功回复 | 引用 API.answer，附加 API.source_note；dataset_id 可作为来源标识保留 |
| 业务失败回复 | 明确说明本次查询未成功，尚未取得数据 |

平台结束节点截图显示“输出”和“回答模板”。接手人员应通过变量选择器插入实际上游输出。若平台不允许两条分支共用结束节点，应按真实产品能力使用独立结束节点或统一输出节点，不猜测变量跨分支可用。

## 解析节点输出

| 字段 | 类型 | 含义 |
|---|---|---|
| startDate | string | YYYY-MM-DD 起始日期 |
| endDate | string | YYYY-MM-DD 用户希望包含的最后一天 |
| productScope | string | all / specific / unknown |
| productName | string | 指定商品原始名称；all 时清空 |
| queryContent | string | 用户需要的指标或明细描述，当前不是 API metric |
| needClarification | boolean | 条件不完整、无效或模型要求澄清时为 true |
| queryStatus | string | ready / clarify |
| clarification | string | 对用户的补充或修正提示 |
| errorMsg | string | 平台附加输出，并非 main 返回的业务字段 |

代码只有在日期有效、顺序正确、商品范围有效且模型明确返回 needClarification=false 时，才输出 queryStatus=ready。解析失败会返回 clarify。

## 智能体引导示例

- 查询[2026年10月]的销售额。
- 查询[2026年10月][商品名称]的销售汇总。
- 查看[2026年10月][商品名称]的销售明细。

最后两条需确认 API 对汇总和明细的真实支持后启用。若配置尚只支持 sales，应将面向用户的引导限制为已测试的销售额查询。
