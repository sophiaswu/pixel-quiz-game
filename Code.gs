// 部署時請選擇「網頁應用程式 (Web App)」-> 存取權限：「所有人 (Anyone)」
const SHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
const QUESTION_SHEET_NAME = '題目';
const ANSWER_SHEET_NAME = '回答';

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName(QUESTION_SHEET_NAME)) {
    const sheet = ss.insertSheet(QUESTION_SHEET_NAME);
    sheet.appendRow(['題號', '題目', 'A', 'B', 'C', 'D', '解答']);
  }
  if (!ss.getSheetByName(ANSWER_SHEET_NAME)) {
    const sheet = ss.insertSheet(ANSWER_SHEET_NAME);
    sheet.appendRow(['ID', '闖關次數', '總分', '最高分', '第一次通關分數', '花了幾次通關', '最近遊玩時間']);
  }
}

function doGet(e) {
  const action = e.parameter.action;
  if (action === "getQuestions") {
    const count = parseInt(e.parameter.count) || 5;
    return getQuestionsResponse(count, e.parameter.callback);
  }
  return createJsonResponse({ error: 'Invalid action' }, e.parameter.callback);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.action === "submit") {
      return createJsonResponse(processSubmit(data.id, data.answers, data.threshold));
    }
  } catch(err) {
    return createJsonResponse({ error: 'Invalid payload' });
  }
  return createJsonResponse({ error: 'Invalid config' });
}

function createJsonResponse(data, callbackName) {
  const jsonString = JSON.stringify(data);
  let output = ContentService.createTextOutput();
  if (callbackName) {
    output.setContent(callbackName + '(' + jsonString + ')');
    output.setMimeType(ContentService.MimeType.JAVASCRIPT);
  } else {
    output.setContent(jsonString);
    output.setMimeType(ContentService.MimeType.JSON);
  }
  // Allow simple CORS requests
  return output;
}

function getQuestionsResponse(count) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(QUESTION_SHEET_NAME);
  if (!sheet) return createJsonResponse({ error: 'Sheet not found' });
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return createJsonResponse({ questions: [] });
  
  const headers = data[0];
  const rows = data.slice(1);
  
  // 隨機打亂並取 N 題
  rows.sort(() => 0.5 - Math.random());
  const selected = rows.slice(0, count);
  
  const questions = selected.map(r => {
    return {
      id: r[0], // 題號
      question: r[1],
      options: { A: r[2], B: r[3], C: r[4], D: r[5] }
    };
  });
  
  return createJsonResponse({ questions: questions });
}

function processSubmit(playerId, answers, threshold) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const qSheet = ss.getSheetByName(QUESTION_SHEET_NAME);
  const aSheet = ss.getSheetByName(ANSWER_SHEET_NAME);
  
  // 1. 對答案算分
  const qData = qSheet.getDataRange().getValues();
  const answerMap = {};
  for (let i = 1; i < qData.length; i++) {
    answerMap[qData[i][0]] = qData[i][6]; // { 題號: 'A' }
  }
  
  let score = 0;
  let totalQuestions = Object.keys(answers).length;
  for (const qId in answers) {
    if (String(answers[qId]).trim().toUpperCase() === String(answerMap[qId]).trim().toUpperCase()) {
      score++;
    }
  }
  
  const passed = score >= threshold;
  
  // 2. 更新紀錄
  const aData = aSheet.getDataRange().getValues();
  let rowIndex = -1;
  let record = null;
  
  for (let i = 1; i < aData.length; i++) {
    if (String(aData[i][0]) === String(playerId)) {
      rowIndex = i + 1;
      record = aData[i];
      break;
    }
  }
  
  const now = new Date();
  
  if (rowIndex === -1) {
    // 新玩家
    const firstPassScore = passed ? score : '';
    const triesToPass = passed ? 1 : '';
    aSheet.appendRow([playerId, 1, score, score, firstPassScore, triesToPass, now]);
  } else {
    // 舊玩家
    // ID(0), 闖關次數(1), 總分(2), 最高分(3), 第一次通關分數(4), 花了幾次通關(5), 最近時間(6)
    let tries = parseInt(record[1]) || 0;
    let totalScore = parseInt(record[2]) || 0;
    let maxScore = parseInt(record[3]) || 0;
    let firstPass = record[4];
    let triesToPass = record[5];
    
    tries += 1;
    totalScore += score;
    if (score > maxScore) maxScore = score;
    
    // 如果之前還沒通關過，且這次通關了
    if (firstPass === '' && passed) {
      firstPass = score;
      triesToPass = tries;
    }
    
    aSheet.getRange(rowIndex, 2, 1, 6).setValues([[tries, totalScore, maxScore, firstPass, triesToPass, now]]);
  }
  
  return {
    score: score,
    passed: passed,
    total: totalQuestions
  };
}
