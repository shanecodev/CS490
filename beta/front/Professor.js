//todo merge shanes script to this file 
//creates question

//creates exam from selected questions 
function createExam(event){
    event.preventDefault();
    const examForm = document.querySelector('#eForm');
    const jsonData = {
       name: examForm.elements['examName'].value,
       creator: "snape",
       questions:getCheckedQuestions()
    }
    submitJsonData(
        "https://web.njit.edu/~asc8/cs490/beta/middle/exam.php",
        "POST",
        JSON.stringify(jsonData));
}

//get checked questions 
function getCheckedQuestions(){
    let checkedQuestions = [];
    var table = document.getElementById("qTable");
    // iterate through rows 
    for (var i = 0, row; row = table.rows[i]; i++) {
        // test if a row is checked 
        if(row.getElementsByTagName('input')[0].checked){
            obj={};
            obj.name = row.cells[1].innerHTML;
            checkedQuestions.push(obj); 
        }
    }    
    console.log(checkedQuestions);
    return checkedQuestions;

}


//inserts columns into row 
function genColumn(item,row){
    var tdElement = document.createElement('td');
    tdElement.innerHTML = item;
    row.appendChild(tdElement);

}


//inserts rows into table 
function genQuestion(row,table){
    var tr = document.createElement('tr');
    table.appendChild(tr);
    var tdElement = document.createElement('td');
    tdElement.innerHTML = '<input type="checkbox">';
    tr.appendChild(tdElement);
    Object.values(row).forEach(value => {
        genColumn(value,tr);
    });
}

//renders table 
async function renderQuestions(){;
    const questionUrl = 'https://web.njit.edu/~asc8/cs490/beta/middle/question.php';
    let table = document.querySelector('#qTable');

    response = await  getJsonData(questionUrl);
    response.map((currentVal)=>{genQuestion(currentVal,table);});
}


//utility functions
async function getJsonData(url){
   let response = await fetch(url);
   return response.json();
  }


function submitJsonData(url, httpMethod, jsondata){
    fetch(url,{
        method: httpMethod,
        headers:{
            'Content-Type': 'application/json'
        },
        body : jsondata
        }).then((response) => response.json())
    return response;  
}



// Adds function calls to html representation calls initial functions 
function init(){
    //use to validate user role 
    let user = sessionStorage.getItem('user');
    let role = 'professor';//sessionStorage.getItem('role');
    if (!(role === 'professor')){
        document.write('<h1>ACCESS DENIED</h1>');
    }
    document.getElementById('eForm').onsubmit = createExam;
    renderQuestions();

}

window.onload = init;
