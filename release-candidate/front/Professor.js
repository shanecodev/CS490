//creates question
var examFinal = [];

//creates exam from selected questions
async function createExam(event) {
  event.preventDefault();
  const examForm = document.querySelector('#eForm');
  const jsonData = {
    name: examForm.elements['examName'].value,
    creator: user,
    questions: removeDuplicateQuestions(examFinal),
  };
  console.log(jsonData);
  let response = await submitJsonData(
    'https://web.njit.edu/~tg253/CS490/beta/front/examproxy.php',
    'POST',
    JSON.stringify(jsonData)
  );
  renderExams();
}

function removeFromExamList(questionId) {
  let questionList = removeDuplicateQuestions(examFinal);
  questionId.remove();
  examFinal = questionList.filter(function (element) {
    return element.name != questionId.id;
  });
}

function addToExamList() {
  let checkedRows = getCheckedRows('qTable');
  for (var i = 0; i < checkedRows.length; i++) {
    examFinal.push(checkedRows[i]);
  }
  let finalQuestions = removeDuplicateQuestions(examFinal);

  console.log(finalQuestions);
  let selectedQuestions = document.getElementById('selected-questions');
  // show the unique questions on the screen
  let p = document.createElement('p');
  for (var i = 0; i < finalQuestions.length; i++) {
    if (
      !document.body.contains(
        document.getElementById(finalQuestions[i]['name'])
      )
    ) {
      p.setAttribute('id', finalQuestions[i]['name']);
      p.appendChild(
        document.createTextNode(
          finalQuestions[i]['name'] +
            ' [' +
            finalQuestions[i]['score'] +
            ' points]  '
        )
      );
      let removeButton = document.createElement('input');
      removeButton.setAttribute('type', 'button');
      removeButton.setAttribute('value', 'Remove');
      removeButton.setAttribute(
        'onclick',
        'removeFromExamList(' + finalQuestions[i]['name'] + ');'
      );
      p.appendChild(removeButton);
    }
  }
  selectedQuestions.appendChild(p);
}

function removeDuplicateQuestions(examList) {
  let temp = [];
  let unique = {};
  for (let i in examList) {
    name = examList[i]['name'];
    unique[name] = examList[i];
  }

  for (i in unique) {
    temp.push(unique[i]);
  }

  return temp;
}

//get checked rows
function getCheckedRows(table) {
  let checkedRows = [];
  var table = document.getElementById(table);
  // iterate through rows
  for (var i = 1, row; (row = table.rows[i]); i++) {
    // test if a row is checked
    if (row.getElementsByTagName('input')[0].checked) {
      obj = {};
      obj.name = row.cells[2].innerHTML;
      obj.score = row.cells[1].childNodes[0].value;
      checkedRows.push(obj);
    }
  }
  //console.log(checkedRows);
  return checkedRows;
}

//get checked rows
function getCheckedStudents(table) {
  let checkedRows = [];
  var table = document.getElementById(table);
  // iterate through rows
  for (var i = 1, row; (row = table.rows[i]); i++) {
    // test if a row is checked
    if (row.getElementsByTagName('input')[0].checked) {
      obj = {};
      obj.name = row.cells[1].innerHTML;
      console.log(row.cells[1].innerHTML);
      checkedRows.push(obj);
    }
  }
  console.log(checkedRows);
  return checkedRows;
}

// confirm grades
async function confirmGrades(event) {
  event.preventDefault();
  const table = document.querySelector('#gTable');
  for (var i = 1, row; (row = table.rows[i]); i++) {
    jsonData = {
      user: row.cells[1].innerHTML,
      exam: selectedExam,
      adjustedGrade: row.cells[0].firstChild.value,
      question: row.cells[2].innerHTML,
      autograde: row.cells[4].innerHTML,
    };
    submitJsonData(
      'https://web.njit.edu/~tg253/CS490/beta/front/resultproxy.php',
      'PUT',
      JSON.stringify(jsonData)
    );
  }
  gradeExam(document.createEvent('Event'));
}

function assignExam(event) {
  event.preventDefault();
  const assignForm = document.querySelector('#assignForm');
  let formVal = event.explicitOriginalTarget.value;
  let jsonData = {};
  if (formVal === 'Assign') {
    let exams = getCheckedStudents('aTable');
    let students = getCheckedStudents('sTable');
    students.map((student) => {
      exams.map((exam) => {
        console.log(student);
        let jsonBody = {
          user: student.name,
          exam: exam.name,
        };
        submitJsonData(
          'https://web.njit.edu/~tg253/CS490/beta/front/examproxy.php',
          'POST',
          JSON.stringify(jsonBody)
        );
      });
    });
  }
  if (formVal === 'close') {
    let exams = getCheckedStudents('aTable');
    exams.map((exam) => {
      console.log('exam:', exam.name);
      let jsonData = { examGraded: exam.name };
      submitJsonData(
        'https://web.njit.edu/~tg253/CS490/beta/front/examproxy.php',
        'PUT',
        JSON.stringify(jsonData)
      );
    });
  }
}

// renders table headders
function renderHeaders(headers, table) {
  var tr = document.createElement('tr');
  table.appendChild(tr);
  headers.map((header) => {
    var th = document.createElement('th');
    th.innerHTML = header;
    tr.appendChild(th);
  });
}

//inserts columns into row
function genColumn(item, row) {
  if (!Array.isArray(item)) {
    var tdElement = document.createElement('td');
    tdElement.innerHTML = item;
    row.appendChild(tdElement);
  }
}

//inserts rows into table
function genAssign(row, table) {
  var tr = document.createElement('tr');
  table.appendChild(tr);
  var tdElement = document.createElement('td');
  tdElement.innerHTML = '<input type="checkbox">';
  tr.appendChild(tdElement);
  Object.values(row).forEach((value) => {
    genColumn(value, tr);
  });
}

//inserts rows into table
function genQuestion(row, table) {
  var tr = document.createElement('tr');
  table.appendChild(tr);
  var tdElement = document.createElement('td');
  tdElement.innerHTML = '<input type="checkbox" onclick="addToExamList();">';
  tr.appendChild(tdElement);
  var scoreElement = document.createElement('td');
  scoreElement.innerHTML = '<input type="text">';
  tr.appendChild(scoreElement);
  Object.values(row).forEach((value) => {
    genColumn(value, tr);
  });
}

//renders options for grader drop down
function renderOptions(exams) {
  let selectBar = document.querySelector('#selectBar');
  exams.map((exam) => {
    let opt = document.createElement('option');
    opt.setAttribute('value', exam.name);
    opt.innerHTML = exam.name;
    selectBar.appendChild(opt);
  });
}

//renders table
async function renderQuestions() {
  const questionUrl =
    'https://web.njit.edu/~tg253/CS490/beta/front/questionproxy.php';
  let table = document.querySelector('#qTable');
  table.innerHTML = '';
  renderHeaders(
    [
      'Select',
      'Update Score',
      'Question',
      'Description',
      'Dificulty',
      'Category',
      'Score',
      'Constraint',
    ],
    table
  );
  response = await getJsonData(questionUrl);
  response.map((currentVal) => {
    if (
      searchString !== '' &&
      currentVal.description.search(searchString) === -1
    ) {
      return;
    }
    if (dificulty !== 'none' && currentVal.difficulty !== dificulty) {
      return;
    }
    if (category !== 'none' && currentVal.category !== category) {
      return;
    }

    genQuestion(currentVal, table);
  });
}

//renders students
async function renderStudents() {
  const questionUrl =
    'https://web.njit.edu/~tg253/CS490/beta/front/userproxy.php?role=student';
  let table = document.querySelector('#sTable');
  table.innerHTML = '';
  renderHeaders(['Select', 'Student'], table);
  response = await getJsonData(questionUrl);
  response.student.map((currentVal) => {
    genAssign(currentVal, table);
  });
}

// renders table of exams by professor
async function renderExams() {
  const examUrl =
    'https://web.njit.edu/~tg253/CS490/beta/front/examproxy.php?prof=';
  let table = document.querySelector('#aTable');
  table.innerHTML = '';
  renderHeaders(['Select', 'Exam'], table);
  let getUrl = examUrl + user;
  response = await getJsonData(getUrl);
  response.exams.map((currentVal) => {
    genAssign(currentVal, table);
  });
}

async function renderGrader(prof) {
  const profExamUrl =
    'https://web.njit.edu/~tg253/CS490/beta/front/examproxy.php?prof=';
  let form = document.querySelector('#gradeform');
  let getUrl = profExamUrl + prof;
  let examsResponse = await getJsonData(getUrl);
  renderOptions(examsResponse.exams);
}

//grade exam
async function gradeExam(event) {
  event.preventDefault();
  let selectBar = document.querySelector('#selectBar');
  let val = selectBar.options[selectBar.selectedIndex].value;
  selectedExam = val;
  document.querySelector('#updateGrade').removeAttribute('hidden');
  let gradeUrl = 'https://web.njit.edu/~tg253/CS490/beta/front/resultproxy.php';
  let body = new Object();
  body.fetchAllResultsByExam = val;
  let data = await postJsonData(gradeUrl, body);
  renderGradeTable(data, val);
}
// render grade details
function renderGradeDetails(gradeDetails, tr) {
  var subTable = document.createElement('table');
  tr.appendChild(subTable);
  var subTr = document.createElement('tr');
  subTable.appendChild(subTr);
  var thElement = document.createElement('th');
  thElement.innerHTML = 'Partial Score';
  subTr.appendChild(thElement);
  var thElement = document.createElement('th');
  thElement.innerHTML = 'Comments';
  subTr.appendChild(thElement);

  gradeDetails.map((detail) => {
    var subTr = document.createElement('tr');
    subTable.appendChild(subTr);
    var tdElement = document.createElement('td');
    tdElement.innerHTML = "<input type='text' value=" + detail.score + '>';
    subTr.appendChild(tdElement);
    var tdElement = document.createElement('td');
    tdElement.innerHTML =
      "<textarea rows='4' cols='50'>Instructor comments</textarea>";
    subTr.appendChild(tdElement);
  });
  return;
}

// render grade table
function renderGradeTable(data, exam) {
  let table = document.querySelector('#gTable');
  table.innerHTML = '';
  renderHeaders(
    [
      'Adjusted Grade',
      'Student',
      'Question',
      'Answer',
      'Auto-Grade',
      'Adjusted Grade',
    ],
    table
  );
  data[exam].map((row) => {
    var tr = document.createElement('tr');
    table.appendChild(tr);
    var tdElement = document.createElement('td');
    tdElement.innerHTML = '<input type="text">';
    tr.appendChild(tdElement);
    Object.values(row).forEach((value) => {
      genColumn(value, tr);
    });
    // breakdown of results
    var subTableRow = document.createElement('tr');
    renderGradeDetails(row.testCaseResponse, subTableRow);
    table.appendChild(subTableRow);
  });
}

//utility functions
async function getJsonData(url) {
  let response = await fetch(url);
  return response.json();
}

async function postJsonData(url, data) {
  let response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

function submitJsonData(url, httpMethod, jsondata) {
  fetch(url, {
    method: httpMethod,
    headers: {
      'Content-Type': 'application/json',
    },
    body: jsondata,
  }).then((response) => response.json());
  return response;
}

// insert question section
//updates screen on question creation
function updateScreen() {
  if (responseObject.questionInsertValid == 'true') {
    insertSuccessText.innerText = 'Question Insert Successful';
  } else {
    insertSuccessText.innerText = 'Question Insert Unsuccessful';
  }
  renderQuestions();
}

//handle question submit
function onSubmit(event) {
  event.preventDefault();
  let questionName = document.getElementById('name');
  let questionDescription = document.getElementById('description');
  let questionDifficulty = document.getElementById('difficulty');
  let questionCategory = document.getElementById('category');
  let testCaseInput1 = document.getElementById('testCaseInput1');
  let testCaseOutput1 = document.getElementById('testCaseOutput1');
  let testCaseInput2 = document.getElementById('testCaseInput2');
  let testCaseOutput2 = document.getElementById('testCaseOutput2');

  let json = {
    name: questionName.value,
    description: questionDescription.value,
    difficulty: questionDifficulty.value,
    category: questionCategory.value,
    testCases: [
      { input: testCaseInput1.value, output: testCaseOutput1.value },
      { input: testCaseInput2.value, output: testCaseOutput2.value },
    ],
  };

  var data = JSON.stringify(json);

  var request = new XMLHttpRequest();
  request.open('POST', 'postQuestion.php', true);
  request.setRequestHeader('Content-type', 'application/json');
  request.send(data);

  request.onreadystatechange = function () {
    if (request.status == 200 && request.readyState == 4) {
      responseObject = JSON.parse(request.responseText);
      updateScreen();
    }
  };
  renderQuestions();
}

function applyFilters(event) {
  event.preventDefault();
  category = document.getElementById('categorySelect').value;
  dificulty = document.getElementById('difficultySelect').value;
  searchString = document.getElementById('SearchText').value;
  renderQuestions();
}

function visibilityChange(element) {
  let createQuestion = document.getElementById('questionCreate');
  let createExam = document.getElementById('examCreate');
  let assignExam = document.getElementById('examAssign');
  let gradeExam = document.getElementById('gradeExam');

  if ((element.hidden = true)) {
    element.hidden = false;
    if (element != createQuestion) {
      createQuestion.hidden = true;
    }
    if (element != createExam) {
      createExam.hidden = true;
    }
    if (element != assignExam) {
      assignExam.hidden = true;
    }
    if (element != gradeExam) {
      gradeExam.hidden = true;
    }
  }
}

// Adds function calls to html representation calls initial functions
function init() {
  //use to validate user role
  user = sessionStorage.getItem('user');
  role = sessionStorage.getItem('role');

  if (!(role === 'Professor')) {
    document.write('<h1>ACCESS DENIED</h1>');
  }
  document.getElementById('eForm').onsubmit = createExam;
  document.getElementById('qForm').onsubmit = onSubmit;
  document.getElementById('assignForm').onsubmit = assignExam;
  document.getElementById('gradeForm').onsubmit = gradeExam;
  document.getElementById('updateGrade').onsubmit = confirmGrades;
  document.getElementById('fForm').onsubmit = applyFilters;
  renderQuestions();
  renderExams();
  renderStudents();
  renderGrader(user);
}
//globals
var category = 'none';
var dificulty = 'none';
var searchString = '';
var selectedExam = '';
var user = '';
var role = '';
// globals and init code
var responseObject;

window.onload = init;
