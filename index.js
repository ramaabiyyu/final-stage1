const express = require("express") //menggunakan library expressjs
const { dirname } = require("path/posix") //menggunakan library path/posix
const bcrypt = require("bcrypt")
const flash = require("express-flash")
const session = require("express-session")

//inisialisasi express
const app = express() 

const PORT = 4000

const db = require("./connection/db")

const upload = require("./middleware/fileUpload")
//view engine setup
app.set("view engine", "hbs")

app.use("/public",express.static(__dirname + "/public"))
app.use("/uploads",express.static(__dirname + "/uploads"))
app.use(express.urlencoded({extended : false}))

app.use(flash())

app.use(
    session({
        cookie: {
            maxAge: 2 * 60 * 60 * 1000, //data disimpan selama 2 jam
            secure: false,
            httpOnly: true
        },
        store: new session.MemoryStore(),
        saveUninitialized: true,
        resave: false,
        secret: "secretValue"

    })
)

// let isLogin = true

//untuk melihat setiap file route harus menggunakan modul express
// app.get("/", function(request, response) { //untuk melakukan aksi di dalam route digunakan variabel request dan seponse
//     response.send("Hello World") //mengirim data string ke halaman dengan route "/"
// }) 
app.get("/register", function(request, response) {
    response.render("register")
})

app.get("/login", function(request, response) {
    response.render("login")
})

app.post("/register", function(request, response) {
    
    const {inputName, inputEmail, inputPassword} = request.body
    
    const hashedPassword = bcrypt.hashSync(inputPassword, 10)

    // console.log(hashedPassword);
    // console.log(inputPassword);
    // return;

    db.connect(function (err,client,done){
        if (err) throw err

        client.query(`INSERT INTO tb_user(name, email, password) VALUES( '${inputName}','${inputEmail}','${hashedPassword}')`, function(err,result){
            if (err) throw err

            request.flash("success", "Register Berhasil! Silahkan Login!")
            response.redirect("/register")
        })
    })
})

app.post("/login", function(request, response) {
    const {inputEmail,inputPassword} = request.body

    let query = `SELECT * FROM tb_user WHERE email = '${inputEmail}'`
    db.connect(function (err,client,done){
        if (err) throw err

        client.query(query, function(err,result){
            if (err) throw err

            console.log(result.rows.length);

            if(result.rows.length == 0){
                
                request.flash("danger", "Email and Password didn't Match!")

                return response.redirect("/login")
            }

            let isMatch = bcrypt.compareSync(inputPassword, result.rows[0].password)

            console.log(isMatch);
            
            if(isMatch){

                request.session.isLogin = true
                request.session.user = {
                    id: result.rows[0].id,
                    name: result.rows[0].name,
                    email: result.rows[0].email
                }

                request.flash("success", "Login success")

                response.redirect("/blog")
            } else{
                request.flash("danger", "Email and Password didn't Match!")

                response.redirect("/login")
            }
        })
    })
})

app.get("/logout", function(request,response){
    request.session.destroy()

    response.redirect("blog")
})

app.post("/blog", upload.single("inputImage"), function(request, response){

    let data = request.body

    const author_id = request.session.user.id

    const image = request.file.filename

    // return console.log(authorid);

    db.connect(function (err,client,done){
        if (err) throw err

        client.query(`INSERT INTO tb_blog(title, content, image, author_id) VALUES( '${data.inputTitle}','${data.inputContent}','${image}', '${author_id}')`, function(err,result){
            if (err) throw err

            response.redirect("/blog")
        })
    })
})

app.get("/", function(request, response) {

    db.connect(function(err, client, done){
        if (err) throw err //apabila error dari database

        client.query("SELECT * FROM tb_card", function(err,result){

            if (err) throw err //apabila error dari query nya
            let data = result.rows           
            response.render("index",{data: data, isLogin: request.session.isLogin, user: request.session.user})
        })
    })
})

app.get("/contact", function(request, response) {
    response.render("contact",{isLogin: request.session.isLogin, user: request.session.user})
})

app.get("/blog", function(request, response) {

    const query = `SELECT tb_blog.id,tb_user.name AS author, tb_blog.author_id, tb_blog.title, tb_blog.image, tb_blog.content, tb_blog.post_at
	FROM tb_blog LEFT JOIN tb_user ON tb_blog.author_id = tb_user.id;`

    console.log(request.session);
    db.connect(function(err, client, done){
        if (err) throw err //apabila error dari database

        client.query(query, function(err,result){

            if (err) throw err //apabila error dari query nya
            console.log(result);
            console.log(result.rows);
            let data = result.rows           
            let dataBlogs = data.map(function(dt){
                return {
                    ...dt,//split operator "...."
                    isLogin: request.session.isLogin,
                    postAt: getFullTime(dt.post_at),
                    distanceTime: getDistanceTime(dt.post_at),
                }
            })
            response.render("blog", {isLogin : request.session.isLogin, user: request.session.user, blogs: dataBlogs})
        })
    })    
})

app.get("/add-blog", function(request, response) {
    
    console.log(request.session.isLogin);

    if(!request.session.isLogin){
        request.flash("danger","Please Login!!!")
        response.redirect("/login")
    }
    
    response.render("add-blog", {isLogin: request.session.isLogin, user: request.session.user} ) //untuk menampilkan file "add-blog" yang terdapat di folder views


})

app.get("/delete-blog/:id", function(request,response){

    if(!request.session.isLogin){
        request.flash("danger","Please Login!!!")
        response.redirect("/login")
    }

    let id = request.params.id;

    db.connect(function (err,client,done){
        if (err) throw err

        client.query(`DELETE FROM tb_blog WHERE id = ${id}`, function(err,result){
            if (err) throw err

            response.redirect("/blog")
        })
    })
})

app.get("/edit-blog/:id", function(request,response){

    if(!request.session.isLogin){
        request.flash("danger","Please Login!!!")
        response.redirect("/login")
    }

    let id = request.params.id;
    
    db.connect(function(err, client, done){
        if (err) throw err //apabila error dari database

        client.query(`SELECT title, content, image FROM tb_blog WHERE id = ${id}`, function(err,result){

            if (err) throw err //apabila error dari query nya
            let data = result.rows   
            console.log(data);        
            let title = result.rows[0].title
            console.log(title);
            let content = result.rows[0].content
            let image = result.rows[0].image
            

            response.render("edit-blog",{id, title,content,image, isLogin: request.session.isLogin, user: request.session.user})
        })
    })    
})

app.post("/edit-blog/:id", upload.single("inputImage"), function(request,response){
    
    let id = request.params.id
    let data = request.body
    const image = request.file.filename
      
    db.connect(function (err,client,done){
        if (err) throw err

        client.query(`UPDATE tb_blog SET title = '${data.inputTitleEdit}', image = '${image}', content = '${data.inputContentEdit}'  WHERE id = ${id}`, function(err,result){
            if (err) throw err
            console.log(result.rows);
            
            response.redirect("/blog")
        })
    })
})

function getFullTime(time){

    let month = ["January", "February", "March", "April", "May", "June", "August", "September", "October", "November", "December"]
  
    let date = time.getDate()
  
    let monthIndex = time.getMonth()
  
    let year = time.getFullYear()
  
    let hours = time.getHours()

    let minutes = time.getMinutes()
  
    let fullTime = `${date} ${month[monthIndex]} ${year} ${hours}:${minutes} WIB`
    return fullTime; 
}

function getDistanceTime(time){
  
    let timePost = time
    let timeNow = new Date()
    
    console.log(timePost);
    console.log(new Date());
    let distance = timeNow - timePost
    console.log(distance);
  
    let milisecond = 1000 //nilai satu detik dalam milisecond
    let secondInHours = 3600 //nilai detik dalam satu jam
    let hoursInDay = 23 //karena hitungan hours dari 0 - 23
  
    let minutes = 60 //minutes dalam hours
    let seconds = 60 //seconds dalam minutes
    
    let distanceDay = Math.floor(distance / (milisecond * seconds * minutes * hoursInDay))
    let distanceHours = Math.floor(distance / (milisecond * seconds * minutes))
    let distanceMinutes = Math.floor(distance / (milisecond * seconds))
    let distanceSeconds = Math.floor(distance / (milisecond))
  
    if (distanceDay >= 1){
      return(`${distanceDay} day ago`);
      } else if(distanceHours >= 1){
      return(`${distanceHours} hours ago`);    
      } else if(distanceMinutes >= 1){
        return(`${distanceMinutes} minutes ago`)
      } else{
        return(`${distanceSeconds} seconds ago`)
      }
}

app.get("/blog-detail/:id", function(request, response) {

    let id = request.params.id

    db.connect(function (err,client,done){
        if (err) throw err

        client.query(`SELECT tb_blog.id,tb_user.name AS author, tb_blog.author_id, tb_blog.title, tb_blog.image, tb_blog.content, tb_blog.post_at
        FROM tb_blog LEFT JOIN tb_user ON tb_blog.author_id = tb_user.id WHERE tb_blog.id = ${id}`, function(err,result){
            if (err) throw err

            let data = result.rows[0]

            result.rows[0].postAt = getFullTime(result.rows[0].post_at)
            console.log(data);
            console.log(result.rows);
            
            response.render("blog-detail", {blog: data, isLogin: request.session.isLogin, user: request.session.user})
        })
    })
})

app.listen(PORT, function() {
    console.log("Server starting on PORT 4000");
})