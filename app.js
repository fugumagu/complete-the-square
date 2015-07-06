//  
// [term, ..., term]

// LeftAndRightTerms
// [ [term, ..., term], [term, ..., term] ]

// sideObject
// { ... }

// grandObject
// [ { }, { }, [powers], variable ]

//var input = prompt("Enter an equation", "here");
$("#solve").on("click", function() {
  var equation = $("#equation").val();
  equation = equation.replace(/\s+/g, "");
  if (equation === "") {
    showError("Please enter an equation");
    return;
  } else if (!(/\=/.exec(equation))) {
    showError('Make sure to enter an equation with an "=" sign');
    return;
  } 
  
  else {
    clearPage();
    doEverything( $("#equation").val() );
  }
});


$("#clear").on("click", clearPage);
$("#clear").on("click", clearInput);

function showError(str) {
  $("#error").html("");
  $("#error").append(str);
}

function clearInput() {
  $("#equation").val("");
}

function clearPage() {
  $("#error").html("");
  $(".row").remove();
}


function printHtml(caption, equation) {
  var $row = $("<div></div>").addClass("row");
  var $caption = $("<div></div>").addClass("caption");;
  var $showWork = $("<div></div>").addClass("show-work");
  var $clearFix = $("<div></div>").addClass("clear-fix");
  
  
  $caption.append("<p>" + caption + "</p>");
  $showWork.append("<p>" + equation + "</p>");
  $row.append($caption);
  $row.append($showWork);
  $row.append($clearFix);
  $("#content-wrapper").append($row);
}

function doEverything(equation) {
  var leftAndRightTerms = [];
  var grandObject;
  
  printHtml("You entered: ", equation);
  
  leftAndRightTerms = getLeftAndRightTerms(equation);
  printHtml("Format: ", simplePrint(leftAndRightTerms));
  
  //get grand object and group like terms
  grandObject = getGrandObject(leftAndRightTerms);
  logGrandObject("First Grand Object", grandObject);
  printHtml("Group like-terms: ", printEquationFromObject(grandObject, true));
  
  grandObject = combineLikeTerms(grandObject);
  logGrandObject("Combine", grandObject);
  printHtml("Combine like-terms: ", printEquationFromObject(grandObject, true));
  
  grandObject = cleanupZeroes(grandObject);
  logGrandObject("Cleanup", grandObject);
  printHtml("Eliminate zeroes: ", printEquationFromObject(grandObject, true));
  
  grandObject = balanceEquation(grandObject);
  logGrandObject("Balance the equation", grandObject);
  printHtml("Balance the equation: ", printEquationFromObject(grandObject, true));
  
  grandObject = cleanupZeroes(grandObject);
  //console.log("Cleanup" + logObject(grandObject));
  printHtml("Eliminate zeroes: ", printEquationFromObject(grandObject, true));
  
  findAddSubtract(grandObject);
}



function simplePrint(leftAndRight) {
  var fullEquation = new Array("", "=", "");
  
  
  leftAndRight.forEach(function(side, sideIndex) {
    var fullSide = ""
    side.forEach(function(term, termIndex) {
      console.log(termIndex);
      //strip coefficient of "1" if it is a variable term
      if (/^[\+\-]?1[a-z]/i.exec(term)) {
        term = term.replace("1", "");
      }
      
      //strip the "+" sign from the front term if it's there
      if (termIndex === 0) {
        if (term.charAt(0) === "+") {
          term = term.substring(1);
        }
      } else {
        term = " " + term.charAt(0) + " " + term.substring(1);
      }
      
      //eliminate unnecessary "to the first power"
      if (/\^1$/.exec(term)) {
        term = term.replace("^1", "");
      }
      
      //replace "^" with html ver
      if (/\^/.exec(term)) {
        term = term.replace("^", "<sup>") + "</sup>";
      }
      
      fullSide += term;
      //console.log(term);
    });
    fullEquation[sideIndex * 2] = fullSide;
    //console.log(fullSide);
  });
  //console.log(fullEquation.join(" "));
  return fullEquation.join(" ");
}








function printEquationFromObject(sideObjectsArray, useHtml) {
  useHtml = useHtml || false;
  var sides = sideObjectsArray[0]; //array with left and right side, each side is an object
  var variable = sides[0]["variable"] || sides[1]["variable"]; //gets the variable used
  var powers = sideObjectsArray[1]; //gets the array of powers
    
  var display = []; //empty array that will be populated in descending order and printed 
  
  //loop over each side object first
  display = sides.map(function(side) {
    var firstTerm = true; //used to keep the first term from getting a "+" and spacing after a "-"
    var listOfTerms = []; //will get each 
    
    //take each power in powers array, which should already be in descending order
    powers.forEach(function(power) {
      
      //strip the word "power" from each power and get the number. assign to exponent
      var exponent = parseFloat(power.replace(/(power)/, ""));
      
      //start constructing the terms
      //if a side has a power, then start going over that power's array of coefficients
      if (side[power]) {
        side[power].forEach(function(coefficient) {
          var term = "";
          //if the term is the first term, don't give it a + sign, otherwise give it a + or a - operator
          if (coefficient >= 0 && firstTerm !== true) {
            term += "+ ";
          } else if (coefficient < 0 && firstTerm !== true) {
            coefficient = -coefficient;
            term += "- ";            
          } else {
            firstTerm = false; //everything after will get a + or - operator
          }
                    
          //if the term has a variable, insert coefficient unless it = 1, then leave it blank
          if (exponent > 0) {
            if (coefficient === 1) {
            } else if (coefficient === -1) {
              term += "-";
            } else {
              term += coefficient;
            }
              
            term += variable;
            
            if (exponent > 1) {
              if (useHtml === true) {
                term += "<sup>" + exponent + "</sup>";                
              } else {
                term += "^";
                term += exponent;
              }
            }
          } else {
            term += coefficient;
          }
          
          //this completes the construction of the term
          
          //add this term to the list of terms
          listOfTerms.push(term);
        });
      }      
    });
    
    //takes the listOfTerms, makes it one nice looking string, and maps it to display[]
    //display[0] is the left side, display[1] is the right side
    return listOfTerms.join(" ");
  });
  
  display = [display[0], "=", display[1]]; //adds the equals sign between the left and right side
  display = display.join(" "); //makes the display array a single string
 
  
  //console.log(display); //logs the new equation to the console
  return display;
}



function cleanupZeroes(sideObjects) {
  var sides = sideObjects[0];
  var newObjects = [];
  
  sides.forEach(function(side, i) {
    var zeroesCount = 0;
    var propertyCount = 0;
    
    for (var property in side) {
      if (property !== "variable") {
        if(side[property][0] === 0) {
          zeroesCount++;
        }
        propertyCount++;
      }
    }
    
    if (propertyCount > 1 && zeroesCount > 0) {
      var newSide = {};
      for (var property in side) {
        if (side[property][0] !== 0) {
          newSide[property] = side[property];
        }
      }
      newObjects[i] = newSide;
    } else {
      newObjects[i] = side;
    }
    
    sideObjects[0][i] = newObjects[i]
  });
  
  //console.log("cleanupZeroes ", sideObjects);
  return sideObjects;  
}



function combineLikeTerms(sideObjects) {
   
  sideObjects[0].forEach(function(side) {
    for (var power in side) {
      var sum = 0;
      
      if (side[power].length > 1) {
        
        sum = side[power].reduce(function(a, b) {
          return a + b;
        });
        
        side[power] = [];
        side[power][0] = sum;
      }
    }
  });
  
  return sideObjects;
}



function balanceEquation(sideObjects) {
  //console.log(sideObjects);  
  var sides = sideObjects[0]; //array with left and right side, each side is an object
  var left = sides[0];
  var right = sides[1];
  var variable = left["variable"] || right["variable"]; //gets the variable used
  var powers = sideObjects[1]; //gets the array of powers
  
  for (var power in right) {
    if (right[power] === "undefined") {
    
    } else {
    
      if (typeof left[power] === "undefined") {
        left[power] = new Array();
        left[power][0] = 0;
      }
      left[power][0] -= right[power][0];
    }
  }
  
  right = {};
  right.power0 = [0];
  right.variable = variable;
  left.variable = variable;
  
  var grandObject = [ [left, right], powers];
  grandObject = combineLikeTerms(grandObject);
  return grandObject;
}



function findAddSubtract(sideObjects) {
  var sides = sideObjects[0];
  var left = sides[0]
  
  if (left.power1) {
    var halfMiddle;
    var addSubtract;
    
    halfMiddle = left.power1[0] / 2;
    addSubtract = halfMiddle * halfMiddle;
    
    left.power0.unshift(addSubtract, -addSubtract);
    //console.log(addSubtract);
    
    printHtml("Identify the middle term coefficient:", left.power1);
    printHtml("Divide it by 2 and square it", addSubtract);
    
    sides[0] = left;
    sideObjects[0] = sides;
    printHtml("Add/subtract this new term", printEquationFromObject(sideObjects, true));
    
  } else {
    console.log("No middle term");
    return;
  }
  
  function signTerm(term, variable) {
    variable = variable || false;
    if (variable === true && (term === 1 || term === -1)) {
      
      if (term === 1) {
        return "+ ";
      } else if (term === -1) {
        return "- ";
      } else {
        return "error";
      }
    } else {
      if (term > 0) {
        return "+ " + term;
      } else if (term < 0) {
        return "- " + -term;
      }
    }
  }
  
  
  
  var printer = ""
  printer = "(" + left.variable + "<sup>2</sup>";
  printer += " " + signTerm(left.power1[0], true) + left.variable;
  printer += " " + signTerm(left.power0[0]) + ")";
  printer += " " + signTerm(left.power0[1]) + " " + signTerm(left.power0[2]);
  printer += " = 0";
  printHtml("Put parentheses around the square:", printer);
  
  var newConstant = left.power0[1] + left.power0[2];
  
  printer = "(" + left.variable;
  printer += " " + signTerm(halfMiddle) + ")<sup>2</sup>";
  printer += " " + signTerm(newConstant) + " = 0";
  printHtml("Factor the square and combine constants", printer);
  
  printer = "(" + left.variable;
  printer += " " + signTerm(halfMiddle) + ")<sup>2</sup> = ";
  var rightSide = -newConstant;
  printer += rightSide;
  printHtml("Throw the constant to the other side", printer);
  
  printer = left.variable;
  printer += " " + signTerm(halfMiddle) + " = ";
  rightSide = Math.sqrt(rightSide);
  printer += " &#177; " + rightSide;
  printHtml("Square root both sides", printer);
  
  
  halfMiddle = -halfMiddle;
  printer = left.variable;
  printer += " = " + halfMiddle + " &#177; " + rightSide;
  printHtml("Put the constants on the right side", printer);
  
  printer = left.variable + " = ";
  printer += halfMiddle - rightSide;
  printer += ", ";
  printer += halfMiddle + rightSide;
  printHtml("Solution:", printer);
  
}






//takes [left side array, right side array], inventories sides, creates sides objects and powers array
function getGrandObject(leftAndRightTerms) {
  
  var powers = []; //will soon contain all powers in descending order
  var leftAndRightObjects;
  var sideObject;
  var variableUsed;
  
  leftAndRightObjects = leftAndRightTerms.map(function(sideTerms) {
    
    //take each side in leftAndRightTerms (unorganized array of terms for left for right) and...
    console.log("before normalization: ", sideTerms);
    sideTerms = normalizeCoefficients(sideTerms); //insert '1's into coefficients
    console.log("after normalization: ", sideTerms);
    sideObject = sortTermTypes(sideTerms); //create an object for each side to inventory term powers and coefficients
    
    //Take each side and create an array (propTypes) of all the powers
    for (var power in sideObject) {
      if (powers.indexOf(power) < 0 && !( power === "variable") ) {
        powers.push(power)
      }
    };
    return sideObject; //returns the 'side' object and puts it back in leftAndRightObjects being mapped
  });
  
  variableUsed = leftAndRightObjects[0].variable || leftAndRightObjects[1].variable;
  console.log("Variable used: " + variableUsed);
  //put in propTypes powers in descending order to iterate in descending order later
  powers.sort();
  powers.reverse();
  
  leftAndRightObjects[0].variable = variableUsed;
  leftAndRightObjects[1].variable = variableUsed;
  
  return [leftAndRightObjects, powers, variableUsed]; //leftAndRight is the [left object, right object] and propTypes is the powers
};
  





//Create unorganized arrays of left and right sides
function getLeftAndRightTerms(equation) {
  var splitEquation = [];
  var leftTerms = [];
  var rightTerms = [];
  var equalsPlace;
  var firstChar;
  var newSplitEquation;
    
  //remove spaces in equation to clean it up
  equation = equation.replace(/\s/g, "");
  
  
  //*******
  
  newSplitEquation = equation.split("=");
  newSplitEquation = newSplitEquation.map(function(side) {
    firstChar = "";
    if (side.charAt(0) === "+" || side.charAt(0) === "-") {
      firstChar = side.charAt(0);
      side = side.substring(1);
    }
  
    side = side.replace(/\+/g, (",+"));
    side = side.replace(/\-/g, (",-"));
    side = firstChar + side;
    side = side.split(",");
    
    return side;
  });
  
  return [newSplitEquation[0], newSplitEquation[1]];
  
  //*******
  
//  //add commas to operators and equals to preserve symbols in split
//  equation = equation.replace(/\=/g, (",=,"));
// 
//  
//  //separate into individual terms and locate = sign
//  splitEquation = equation.split(/\,/);
//  equalsPlace = splitEquation.indexOf("=");
//    
//  //assign terms to left and right arrays
//  leftTerms = splitEquation.slice(0, equalsPlace);
//  rightTerms = splitEquation.slice(equalsPlace + 1);
//  
//  return [leftTerms, rightTerms];
}



//Add coefficient of 1 to terms with no coefficient
function normalizeCoefficients(sideTerms) {
  var normalizedSideTerms = [];
  
  //Check if the term has no coefficient
  normalizedSideTerms = sideTerms.map(function(term) {
    if (isNaN(parseFloat(term))) {
      if (term.charAt(0) === "-") {
        term = term.replace("-", "-1");
      } else if (term.charAt(0) === "+"){
        term = term.replace("+", "1");
      } else {
        term = "1" + term;
      }
    } else if (term.charAt(0) === "+") {
      term = term.replace("+","");
    }
    
    return term;
  });
  
  return normalizedSideTerms; //returns array of arrays [ [left terms], [right terms] ] where coefficients are normalized
}



//Helper function. Takes an array of terms.
//Creates an object. Properties are variable = a character,
//power0 = [coefficients], power1 = [coefficients], etc.
function sortTermTypes(sideTerms) {
  
  //Create object that will hold all information for an expression
  //including coefficients, power, variable used, and constant terms
  //console.log("sortTermTypes receives: ", sideTerms);
  
  var sideObject = {};
  
  logObject("Starting sortTermTypes", sideObject);
  
  sideObject.variable = "";
    
  //Loop through each term to find if variable term or constant term
  sideTerms.forEach(function(term) {
    //Check if the term has a variable
    if ( /[a-z]/i.exec(term) ) {
      //console.log(term + " is a variable term");
      var splitTerm = ""
      var coefficient = "";
      var variableUsed = "";
      var power = "";
      
      //Find the variable, coefficient, and power
      splitTerm = term.split(/\^/);
      //console.log(splitTerm);
      
      coefficient = parseFloat(splitTerm[0]);
      variableUsed = splitTerm[0].replace(/[\+\-]?[0-9]+/g, "") || splitTerm[1].replace(/[\+\-]?[0-9]+/g, "");
      if (splitTerm.length > 1) {
        power = parseFloat(splitTerm[1]);
      } else {
        power = 1;
      }
      
      console.log(splitTerm, "Coefficient: ", coefficient, "variable: ", variableUsed, "power: ", power);
      
      //Assign coefficient to power array
      if (!(sideObject["power" + power])) {
        sideObject["power" + power] = [];
      }
      sideObject["power" + power].push(coefficient);
            
     //Assign variable to variable property
      sideObject.variable = variableUsed;
      
    } else {
      //If not a variable term, it's a constant term
      console.log(term + " is a constant term");
      if (!(sideObject.power0)) {
        sideObject.power0 = [];
      }
      sideObject.power0.push(parseFloat(term));  
      
    }
  }); //end of forEach loop that checks if variable or constant term
   
  //returns a side object to inventoryEquation function
  
  logObject("Ending sortTermTypes", sideObject);
  
  return(sideObject);
}



function logObject(msg, obj) {
  console.log(msg + ": {");
  for(prop in obj) {
    console.log(prop + ": " + obj[prop]);
  };
  console.log("}");
}

function logGrandObject(msg, arr) {
  console.log(msg + ": {");
  console.log("left: ");
  for (prop in arr[0][0]) {
    console.log(prop + ": " + arr[0][0][prop]);
  };
  console.log("right: ");
  for (prop in arr[0][1]) {
    console.log(prop + ": " + arr[0][1][prop]);
  }
  console.log("}");
}




















