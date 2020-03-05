<?php

require_once('./controller.php');
require_once('./constants.php');

/** Grader.php
 * Written by: Avel Shane Coronado
 * CS490 Spring 2020
 * POST requests to this endpoint will take in a student ID and exam name
 * It will then GET request to the completed student's exam and then it will:
 * extract each question name, answers (testCases), and raw student answers
 * 
 * For each exam question: 
 * 1. Test the function name and ensure it was written correctly (points)
 * 2. Test the raw answer and exec the python code to ensure it passes 2 test cases (points)
*/

/** initialize the PUT request body into an associative array to send to Tom's PUT service */
$put_request = array('user' => '', 'exam' => '', 'question' => '', 'autograde' => '', 'adjustedGrade' => '');

/** decode the incoming question request into an associative array */
$post = file_get_contents('php://input');
$json = json_decode($post, true);

class Grader {

  private $question;
  private $answer;
  private $input;
  private $output;
  private $final;

  function set_question($question) {
    $this->question = $question;
  }

  function get_question() {
    return $this->question;
  }

  function set_answer($answer) {
    $this->answer = $answer;
  }

  function get_answer() {
    return $this->answer;
  }

  function set_test_input($input) {
    $this->input = $input;
  }

  function get_test_input() {
    return $this->input;
  }

  function set_test_output($output) {
    $this->output = $output;
  }

  function get_test_output() {
    return $this->output;
  }

  function set_final($final) {
    $this->final = $final;
  }

  function get_final() {
    return $this->final;
  }

  // grade the student's raw answer based on correctness
  public function grade_func_name($question, $answer) {
    $score = 0;
    
    // python def keyword (3 chars)
    $def_keyword = substr($answer, 0, 3);

    // returns everything before the open paren 'def squareNumber'
    $open_paren = strstr($answer, "(", true);

    // want to get the function name, def_FUNCTIONNAME()
    // its in between the space after def and the first open parenthesis

    // ++score if the question is correct, else don't add score
    if ($question == substr($open_paren, strlen($def_keyword)+1)) {
      $score += 5;
      echo 'Added 5 points for correct function name!';
    } else {
      $score += 0;
    }

    set_final($score);
  }

  // grade the student's raw answer based on test cases
  public function grade_test_case($input, $output, $answer, $question) {
    $score = 0;

    // need to format the question in the event the student misspelled the function name
    $def_keyword = substr($answer, 0, 3);
    $open_paren = strstr($answer, "(", true);
    $student_question = substr($open_paren, strlen($def_keyword)+1);
    
    // format the answer to split the raw answer by adding a newline and tab for proper python syntax
    $before_colon = substr(strstr($answer, "p", true), 0);
    $after_colon = strstr($answer, "p");
    $formatted_answer = "$before_colon\n\t$after_colon";

    // create python text file from input answer, append the function name with the test case input
    $content = "$formatted_answer \n\n$student_question($input)";
    $pythonfile = file_put_contents('exam.py', $content);
    
    // execute python text file
    // return result of file
    $student_result = shell_exec("python3 exam.py");

    // if clean compile, +5 points
    if ($student_result > 0) {
      $score += 5;
      // if testcase 1 correct, +5
      if ($student_result = $output) {
        $score += 5;
      } else {
        $score += 0;
      }
    }

    set_final($score);
  }
}

/** This is where we will do the main logic of the auto grader */
if (isset($json['exam']) && isset($json['user'])) {

  /** cURL backend exam using query parameter for the name front end will pass query name through json */
  $endpoint = RESULT_URL . '?' . http_build_query(array('exam' => $json['exam'], 'user' => $json['user']));
  
  // set up the GET request to Tom's endpoint for a student's exam answers
  $get_controller = new Controller();
  $get_controller->setUrl($endpoint);
  $curl = $get_controller->curl_get_request($get_controller->getUrl());
  $db_validation = json_decode($curl, true);
  
  // instantiate a Grader object to run the grader
  $grader = new Grader();

  // this is the information from the database for the provided student and exam name
  // echo $curl;

  // final_score
  $final_score = 0;

  /** check if the results field is provided */
  if (isset($db_validation['results'])) {
    /** traverse through each result object for the question name and answer */
    for ($i = 0; $i < count($db_validation['results']); $i++) {
      
      // set each question and answer to pass to the grader
      $grader->set_question($db_validation['results'][$i]['question']);
      $grader->set_answer($db_validation['results'][$i]['answer']);

      // set each question's test cases' input and output to the grader
      for ($j = 0; $j < count($db_validation['results'][$i]['testCases']); $j++) {
        $grader->set_test_input($db_validation['results'][$i]['testCases'][$j]['input']);
        $grader->set_test_output($db_validation['results'][$i]['testCases'][$j]['output']);

        // call the test case grader and store the grade
        $grader->grade_test_case($grader->get_test_input(), $grader->get_test_output(), $grader->get_answer(), $grader->get_question());

      }
      
      // call the function grader and store the grade
      $grader->grade_func_name($grader->get_question(), $grader->get_answer());

      // map to the body for put request
      $put_request['user'] = $db_validation['user'];
      $put_request['exam'] = $db_validation['exam'];
      $put_request['question'] = $db_validation['results'][$i]['question'];
      $put_request['autograde'] = $final_score;
      $put_request['adjustedGrade'] = $final_score;


      // Once the exam is graded, send the autoGrade and adjustedGrade along with the user, examname, and question
      // $put_exam_result = RESULT_URL;
      // $put_controller = new Controller();
      // $put_controller->setUrl($put_exam_result);
      // $put_controller->setBody($put_request);
      // $put_curl = $put_controller->curl_put_request($put_controller->getUrl(), $put_controller->getBody());
      // $put_validation = json_decode($put_curl, true);
      echo $final_score;
    }
  } else {
    echo 'STUDENT_EXAM error: could not find the results property.';
  }
} else {
  echo 'POST error: fields \'user\' and \'exam\' were not properly passed.';
}


// $student = isset($json['student']['0']['student']);

// $raw_answer = "def square(i): return i * i";
// $test_cases = "";

// // python def keyword (3 chars)
// $def = substr($raw_answer, 0, 3);

// // returns everything before the open paren 'def squareNumber'
// $open_paren = strstr($raw_answer, "(", true);

// // want to get the function name, def_FUNCTIONNAME()
// // its in between the space after def and the first open parenthesis
// // returns the name of the answer's function

// // uncomment this line to enable the string of the function name
// $student_answer_func_name = substr($open_paren, strlen($def));

// // get the student object
// foreach($json as $item) {
//   //print_r( 'Student name: ' . '\'' . $item['student'] . '\' ');
//   //print_r( 'Exam name: ' . '\'' .  $item['name'] . '\' ');
//   // get the exam object array from the json object
//   foreach($json as $item) {
//     foreach($item['exam'] as $exam_item) {
//       // python def keyword (3 chars)
//       $def = substr($exam_item['answer'], 0, 3);

//       // returns everything before the open paren 'def squareNumber'
//       $open_paren = strstr($exam_item['answer'], "(", true);
//       //echo 'the exam question: ' . '\'' . $exam_item['question'] . '\' ';
//       //echo 'before (: ' . '\'' . $open_paren . '\' ';
//       //echo 'the answer func: ' . '\'' . substr($open_paren, strlen($def)+1) . '\' ';
      
//       if ($exam_item['question'] == substr($open_paren, strlen($def)+1)) {
//         echo 'true';
//       } else {
//         echo 'false';
//       }

      
//     }
//   }
// }

// return result as our 'response'
//header('Content-type: application/json');
//echo json_encode($response);

?>