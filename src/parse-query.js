function main(params) {
  var result = {
    startDate: "",
    endDate: "",
    productScope: "unknown",
    productName: "",
    queryContent: "",
    needClarification: true,
    queryStatus: "clarify",
    clarification: "请重新提供明确的查询起止日期和商品范围。"
  };

  function text(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    var date = new Date(value + "T00:00:00Z");
    return !isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }

  try {
    var raw = text(params && params.jsonText);
    raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    var data = JSON.parse(raw);
    if (!data || typeof data !== "object" || Array.isArray(data)) return result;

    result.startDate = text(data.startDate);
    result.endDate = text(data.endDate);
    result.productScope = text(data.productScope);
    result.productName = text(data.productName);
    result.queryContent = text(data.queryContent);

    var issues = [];
    if (!validDate(result.startDate) || !validDate(result.endDate)) {
      issues.push("请提供有效的起止日期，包含年份，格式如2026-10-01");
    } else if (result.startDate > result.endDate) {
      issues.push("开始日期不能晚于结束日期，请修正查询期间");
    }

    if (result.productScope !== "all" && result.productScope !== "specific") {
      result.productScope = "unknown";
      issues.push("请说明查询全部商品还是指定商品");
    } else if (result.productScope === "specific" && !result.productName) {
      issues.push("请补充需要查询的商品名称");
    } else if (result.productScope === "all") {
      result.productName = "";
    }

    if (issues.length > 0) {
      result.clarification = issues.join("；") + "。请重新发送包含完整查询条件的问题。";
    } else if (data.needClarification !== false) {
      result.clarification = text(data.clarification) || result.clarification;
    } else {
      result.needClarification = false;
      result.queryStatus = "ready";
      result.clarification = "";
    }
  } catch (error) {
    result.clarification = "未能正确解析查询条件，请重新提供明确的查询起止日期和商品范围。";
  }

  return result;
}
