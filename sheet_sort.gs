function onEdit(e) {
  // 如果不是用户正常编辑（例如API调用或其他奇怪触发），直接退出
  if (!e || !e.range) return;

  var range = e.range;
  var sheet = range.getSheet();
  var sheetName = sheet.getName();
  var value = e.value; 
  var row = range.getRow();
  var col = range.getColumn();
  var ss = e.source;

  // 避免用户选中多行多列批量删除或粘贴导致脚本报错
  if (range.getNumRows() > 1 || range.getNumColumns() > 1) return;

  // ================= 配置区域开始 =================
  var OVERVIEW_SHEET = "Overview";     // 总表的名称
  var START_ROW = 4;                   // 数据从第几行开始（跳过表头）
  
  // Overview 表的列号配置 (A=1, B=2, C=3, D=4...)
  var COL_ROUND = 3;                   // C列：Round 的名称
  var COL_TITLE = 4;                   // D列：Puzzle Title (触发建表的列)
  var COL_STATUS = 5;                  // E列：Status (状态列)
  var COL_ANSWER = 6;                  // F列：Answer (答案列)

  // 模板名称配置
  var NORMAL_TEMPLATE = "Template";    
  var META_TEMPLATE = "Meta Template"; 
  var META_PREFIX = "[Meta]";          

  // 题目分表内部的单元格位置配置
  var CELL_TITLE = "B1";               // 填写 Puzzle Title 的单元格
  var CELL_ANSWER = "B3";              // 填写 Answer 的单元格
  var CELL_ROUND = "B4";               // 填写 Round Meta is For 的单元格

  // 状态与样式配置
  var SOLVED_TEXT = "Solved";          // 解决后填入的状态文字
  var SOLVED_COLOR = "#6aa84f";        // 解决后标签变绿的色号
  // ================= 配置区域结束 =================

  var overviewSheet = ss.getSheetByName(OVERVIEW_SHEET);
  if (!overviewSheet) return;

  // -------------------------------------------------------------------
  // 场景 1：在 Overview 填入新题目 (D列) -> 自动建表 & 填入标题(B1)/Round(B4)
  // -------------------------------------------------------------------
  if (sheetName === OVERVIEW_SHEET && col === COL_TITLE && row >= START_ROW) {
    if (!value || value.trim() === "") return; // 清空单元格不触发

    var newName = value.trim();
    if (ss.getSheetByName(newName)) return; // 防呆：避免重复创建

    // 判断是否为 Meta 并选择模板
    var isMeta = newName.startsWith(META_PREFIX);
    var templateName = isMeta ? META_TEMPLATE : NORMAL_TEMPLATE;
    var templateSheet = ss.getSheetByName(templateName);

    if (!templateSheet) {
      SpreadsheetApp.getUi().alert("找不到模板工作表: " + templateName);
      return;
    }

    // 复制模板并重命名
    var newSheet = templateSheet.copyTo(ss);
    newSheet.setName(newName);
    newSheet.showSheet(); 
    newSheet.setTabColor(null); // 确保新表没有颜色

    // 将输入的题目名称填入新表的 B1
    newSheet.getRange(CELL_TITLE).setValue(newName);

    // 如果是 Meta，将 Overview 中同行的 C列 (Round) 填入 B4
    if (isMeta) {
      var roundName = overviewSheet.getRange(row, COL_ROUND).getValue();
      newSheet.getRange(CELL_ROUND).setValue(roundName);
    }

    // 将 Overview 原单元格变成链接
    var richText = SpreadsheetApp.newRichTextValue()
      .setText(newName)
      .setLinkUrl("#gid=" + newSheet.getSheetId())
      .build();
    range.setRichTextValue(richText);
    return;
  }

  // -------------------------------------------------------------------
  // 场景 2：在 Overview 直接填入答案 (F列) -> 标为Solved & 同步到子表 & 隐藏子表
  // -------------------------------------------------------------------
  if (sheetName === OVERVIEW_SHEET && col === COL_ANSWER && row >= START_ROW) {
    if (!value || value.trim() === "") return; // 只是清空的话不触发

    // 在 Overview 同一行的 Status (E列) 填入 "Solved"
    overviewSheet.getRange(row, COL_STATUS).setValue(SOLVED_TEXT);

    // 读取同行 D列 的题目名称，用来寻找子表
    var puzzleTitle = overviewSheet.getRange(row, COL_TITLE).getValue();
    if (!puzzleTitle) return;

    var targetSheet = ss.getSheetByName(puzzleTitle);
    if (targetSheet) {
      // 在子表的 B3 填入答案
      targetSheet.getRange(CELL_ANSWER).setValue(value);
      // 变绿并隐藏
      targetSheet.setTabColor(SOLVED_COLOR);
      targetSheet.hideSheet();
    }
    return;
  }

  // -------------------------------------------------------------------
  // 场景 3：在子表内填入答案 (B3单元格) -> 标为绿/隐藏 & 同步回 Overview
  // -------------------------------------------------------------------
  // 首先排除 Overview 表和两个模板表，确保我们是在子表里操作
  if (sheetName !== OVERVIEW_SHEET && sheetName !== NORMAL_TEMPLATE && sheetName !== META_TEMPLATE) {
    // 判断修改的是不是 B3 (第2列，第3行)
    if (col === 2 && row === 3) {
      if (!value || value.trim() === "") return; 

      // 1. 处理子表自身：变绿、隐藏
      sheet.setTabColor(SOLVED_COLOR);
      sheet.hideSheet();

      // 2. 处理同步回 Overview
      var lastRow = overviewSheet.getLastRow();
      if (lastRow < START_ROW) return;
      
      // 一次性获取 Overview 中 D列 (Title) 的所有数据，用来查找当前子表对应的是哪一行
      var titlesRange = overviewSheet.getRange(1, COL_TITLE, lastRow);
      var titles = titlesRange.getValues();
      var targetRow = -1;

      for (var i = 0; i < titles.length; i++) {
        if (titles[i][0] === sheetName) {
          targetRow = i + 1; // 数组从0开始，行号从1开始，所以+1
          break;
        }
      }

      // 如果在 Overview 里找到了这道题所在的行
      if (targetRow !== -1) {
        overviewSheet.getRange(targetRow, COL_STATUS).setValue(SOLVED_TEXT);
        overviewSheet.getRange(targetRow, COL_ANSWER).setValue(value);
      }
      return;
    }
  }
}
