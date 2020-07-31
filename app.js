//jshint esversion:6
// jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose=require("passport-local-mongoose");
const https = require("https");
const request = require('request');

const app = express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
  secret: "skdvnskvns",
  resave:false,
  saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb+srv://admin-ravi:mongoDB%40123%23@stockmarket-vy4zx.mongodb.net/stockUserDB", {useNewUrlParser: true, useUnifiedTopology: true} );
mongoose.set('useCreateIndex', true);

const stockSchema =new mongoose.Schema ({
  companyname: String,
  companysymbol: String,
  quantity:Number,
  purchase:Number
  //current: Number,

});

const userSchema =new mongoose.Schema ({
  name: String,
  //username: String,
  email:String,
  since: Number,
  buying_power: Number,
  stocks:[stockSchema]
});

const mainUserSchema= new mongoose.Schema ({
  username: String,
  password: String
});

// console.log(process.env.API_KEY);

// userschema.plugin(encrypt, {secret:process.env.SECRET , encryptedFields: ["password"]});
mainUserSchema.plugin(passportLocalMongoose);

const User=new mongoose.model("User",userSchema);
const Stock=new mongoose.model("Stock",stockSchema);
const MainUser=new mongoose.model("MainUser",mainUserSchema);

passport.use(MainUser.createStrategy());

// passport.use(new LocalStrategy({   // 'login-signup' is optional here
// // usernameField : 'email',
// // passwordField : 'password',
// passReqToCallback : true },function(req, username,password, done) {
// var gender = req.body.gender;
// var username = req.body.username;
// var phone = req.body.phone;
// // Now you can access gender username and phone
//
// }));

passport.serializeUser(MainUser.serializeUser());
passport.deserializeUser(MainUser.deserializeUser());


app.get("/", function(req, res){
  res.render("index");
});

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/signup", function(req, res){
  res.render("signup");
});

function calculate_acc_value(user){
  let acc_value=0;

  user.stocks.forEach(function(it){

    const url="https://financialmodelingprep.com/api/v3/company/profile/"+it.companysymbol;
    https.get(url,function(response){
      // console.log(response.statusCode);

      if(response.statusCode===404){
        //res.send("<h1>Please Enter valid company , FU user! </h1>");
      }else{
        // console.log("in the way");
        response.on("data",function(data){

          const companyData=JSON.parse(data);
          //console.log(weatherData.weather[0].description);
          const currentPrice=companyData.profile.price;
          const purchasePrice=it.purchase;
          const quantity=it.quantity;
          const temp=(currentPrice-purchasePrice)*quantity;
          acc_value=acc_value+temp;
          // console.log(currentPrice+"currentPrice of"+companyData.profile.companyName);
          // console.log(purchasePrice);
          // console.log(temp);
          // console.log(acc_value);
        });
      }

    });
  });
  // console.log("buy ji");
  // console.log(acc_value);
  return acc_value;

}

// var companyGainer=[];
//
// function top_gainers(temp){
//   var result;
//   const url="https://financialmodelingprep.com/api/v3/stock/"+temp;
//
//   https.get(url,function(response){
//     console.log(response.statusCode);
//
//     if(response.statusCode===404){
//       res.send("<h1>Please Enter valid company , FU user! </h1>");
//     }else{
//         response.on("data",function(data){
//
//         var companyData=JSON.parse(data);
//
//         result=companyData.mostGainerStock;
//         return result;
//       });
//     }
//
//   });
//
// }

app.get("/profile", function(req, res){
  if(req.isAuthenticated()){
    // console.log(req.user.username);
    const xusername=req.user.username;

    User.findOne({email: xusername},function(err,foundit){
      if(err){
        console.log(err);
      }else{
        if(foundit){
          // console.log(foundit.name);
          let acc_value=calculate_acc_value(foundit);
          // console.log("helli ji");
          // console.log(acc_value);
          res.render("profile",{user:foundit , acc_value:acc_value});
          // var companyGainer;
          // var companyLooser;
          //
          // const url="https://financialmodelingprep.com/api/v3/stock/gainers";
          // const url2="https://financialmodelingprep.com/api/v3/stock/losers";
          // // TOP 5 GAINER
          // https.get(url,function(response){
          //   if(response.statusCode===404){
          //     res.send("<h1>Please Enter valid company , FU user! </h1>");
          //   }else{
          //       response.on("data",function(data){
          //       var companyData=JSON.parse(data);
          //       companyGainer=companyData.mostGainerStock;
          //     });
          //   }
          // });
          // // TOP 5 LOOSER
          // https.get(url2,function(response2){
          //   if(response2.statusCode===404){
          //     res.send("<h1>Please Enter valid company , FU user! </h1>");
          //   }else{
          //       response2.on("data",function(data2){
          //       var companyData2=JSON.parse(data2);
          //       companyLooser=companyData2.mostLoserStock;
          //     });
          //   }
          // });
          // Render to profile page
          // setTimeout(function(){
          //   res.render("profile",{user:foundit , acc_value:acc_value});//, companyGainer:companyGainer});
          // },3500);


        }
      }
    });

  }else{
    res.redirect("/login");
  }

});


app.get("/trade",function(req,res){


  if(req.isAuthenticated()){
    // console.log(req.user.username);
    const xusername=req.user.username;

    User.findOne({email: xusername},function(err,foundit){
      if(err){
        console.log(err);
      }else{
        if(foundit){
          // console.log(foundit.name);
          let acc_value=calculate_acc_value(foundit);
          // console.log("helli ji");
          // console.log(acc_value);
          res.render("trade",{user:foundit , acc_value:acc_value});


        }
      }
    });

  }else{
    res.redirect("/login");
  }

});

app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});

app.get("/research", function(req, res){
  res.render("research");
});

// var result=[];
function build_porfolio(user){

  var result=[];
  user.stocks.forEach(function(it){

    const url="https://financialmodelingprep.com/api/v3/company/profile/"+it.companysymbol;
    https.get(url,function(response){
      console.log(response.statusCode);

      if(response.statusCode===404){
        //res.send("<h1>Please Enter valid company , FU user! </h1>");
      }else{
        console.log("in the way");
        response.on("data",function(data){

          const companyData=JSON.parse(data);
          //console.log(weatherData.weather[0].description);
          // const currentPrice=companyData.profile.price;
          // const purchasePrice=it.purchase;
          // const quantity=it.quantity;
          // const temp=(currentPrice-purchasePrice)*quantity;
          // acc_value=acc_value+temp;
          // console.log(currentPrice+"currentPrice of"+companyData.profile.companyName);
          // console.log(purchasePrice);
          // console.log(temp);
          // console.log(acc_value);
          const yelo ={
            Symbol : it.companysymbol,
            Name : it.companyname,
            Quantity : it.quantity,
            Pur_Price : it.purchase,
            Curr_Price : companyData.profile.price,
            Total_Value : companyData.profile.price*it.quantity,
            Todays_Change : companyData.profile.changes,
            Perc_Change : companyData.profile.changesPercentage
          };
          // console.log(yelo);

        result.push(yelo);
          // console.log(result);


        });
      }

    });
  });
  console.log("sfgkknsdkfnnkksdkfnsk");
  // console.log(result);
  return result;

    // callback(result);



}

// function myCallback(result){
//   console.log(result);
// }

app.get("/portfolio",function(req,res){
  // const currentUserName=req.user.username;


  if(req.isAuthenticated()){
    // console.log(req.user.username);
    const currentUserName=req.user.username;

    User.findOne({email: currentUserName},function(err,foundit){
      if(err){
        console.log(err);
      }else{
        if(foundit){
          // console.log(foundit.name);
          // let acc_value=calculate_acc_value(foundit);
          var boughtData=build_porfolio(foundit);

          console.log("kuttatatatatatatatatata ji");
            let acc_value=calculate_acc_value(foundit);
          // res.render("profile",{user:foundit , acc_value:acc_value});

          setTimeout(function(){
            res.render("portfolio",{boughtData:boughtData , name:foundit.name, username:foundit.email, acc_value:acc_value, buy_power:foundit.buying_power } );
            // console.log(boughtData);
          },5000);



        }
      }
    });

  }else{
    res.redirect("/login");
  }





});

app.post("/signup",function(req,res){



  MainUser.register({username: req.body.username},req.body.password, function(err,user){
    if(err){
      console.log(err);
      res.redirect("/signup");
    }else{

      // console.log(req.body);

      var today=new Date();
      var currentYear=today.getFullYear();
      const newUser=new User({

        name: req.body.name,
        //username: String,
        email:req.body.username,
        since: currentYear,
        buying_power: 20000,
        stocks:[]

      });
      newUser.save();
      passport.authenticate("local")(req,res,function(){
        res.redirect("/profile");
      });
    }
  });

});


app.post("/login",function(req,res){
  // console.log(req.body);

  const mainuser=new MainUser({
    username:req.body.username,
    password:req.body.password
  });
  req.login(mainuser, function(err){
    if(err){
      console.log(err);
    }else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/profile");
      });
    }
  });

});


app.post("/trade", function(req, res){

  const companySymbol=req.body.symbol;
  const quantity=req.body.quantity;
  const currentUserName=req.user.username;
  const url="https://financialmodelingprep.com/api/v3/company/profile/"+companySymbol;
  https.get(url,function(response){
    // console.log(response.statusCode);

    if(response.statusCode===404){
      res.send("<h1>Please Enter valid company , FU user! </h1>");
    }else{
      response.on("data",function(data){

        const companyData=JSON.parse(data);
        //console.log(weatherData.weather[0].description);
        const currentPrice=companyData.profile.price;
        User.findOne({email: currentUserName}, function(err, foundUser){
          if(err){
            console.log(err);
          }else{
            if(foundUser){
              const buying_power=foundUser.buying_power;
              const moneyRequired=quantity*companyData.profile.price;
              // if(req.body.press === "buy" && moneyRequired > buying_power){
              //   res.redirect("/trade");
              // }else
              if(req.body.press === "buy"){
                if( moneyRequired > buying_power){
                      res.redirect("/trade");
                }
                else{
                      foundUser.buying_power-=moneyRequired;
                      const newStock = new Stock({
                        companyname: companyData.profile.companyName,
                        companysymbol: companyData.symbol,
                        quantity:quantity,
                        purchase:currentPrice,
                      });
                      foundUser.stocks.push(newStock);
                      foundUser.save(function(){
                        res.render("buy", {quantity:quantity, companyName:companyData.profile.companyName, purchasePrice:companyData.profile.price});
                      });
                }


              }else {


                let deleteStock;
                foundUser.stocks.forEach(function(it){
                  if(it.companysymbol === companySymbol){
                    deleteStock=it;
                  }
                });
                if( quantity > deleteStock.quantity){
                  res.redirect("/trade");
                }else{
                      foundUser.buying_power+=moneyRequired;
                      let newStockArray=[];
                      foundUser.stocks.forEach(function(it){
                        if(it.companysymbol === companySymbol){
                          const remainingQnty=it.quantity-quantity;
                          if(remainingQnty>0){
                            it.quantity=remainingQnty;
                            newStockArray.push(it);
                          }
                        }else{
                          newStockArray.push(it);
                        }
                      });
                      foundUser.stocks=newStockArray;
                      foundUser.save(function(){
                        res.render("sell", {quantity:quantity, companyName:companyData.profile.companyName, soldPrice:companyData.profile.price});
                      });
                }




              }




            }
          }
        });
      });
    }

  });


});

app.post("/getsymbol",function(req,res){

  var companyName=req.body.companyName;
  const currentUserName=req.user.username;
  const url="https://financialmodelingprep.com/api/v3/search?query="+companyName;

  https.get(url,function(response){
    // console.log(response.statusCode);
    //res.send(response);
    if(response.statusCode===404){
      res.send("<h1>Please Enter valid company name! </h1>");
    }else{
        response.on("data",function(data){

        var companyData=JSON.parse(data);
        //console.log(weatherData.weather[0].description);

        res.render("getsymbol",{companyData:companyData});
      });
    }


  });


});

app.post("/getstockprice",function(req,res){

  var companySymbol=req.body.symbol;
  const currentUserName=req.user.username;
  const url="https://financialmodelingprep.com/api/v3/company/profile/"+companySymbol;

  https.get(url,function(response){
    // console.log(response.statusCode);
    //res.send(response);
    if(response.statusCode===404){
      res.send("<h1>Please Enter valid company name! </h1>");
    }else{
        response.on("data",function(data){

        var companyData=JSON.parse(data);
        //console.log(weatherData.weather[0].description);

        res.render("getstockprice",{companyData:companyData});
      });
    }


  });


});





app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});
