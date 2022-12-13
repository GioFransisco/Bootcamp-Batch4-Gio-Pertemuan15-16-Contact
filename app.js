const express = require('express')
const func = require('./callfunction')
const app = express()
const { check,validationResult } = require('express-validator')
const path = require('path');
const expressLayout = require('express-ejs-layouts');
const { name } = require('ejs');
const { body } = require('express-validator');
const { isErrored } = require('stream');
const port = 3000
// const bodyParser = require('body-parser')
// const morgan = require('morgan')

// parse application/x-www-form-urlencoded
app.use(express.urlencoded({extended : true}))

// parse application/json
// app.use(bodyParser.json())

//information using EJS
app.set('view engine', 'ejs')

//using third party express layout
app.use(expressLayout)

// app.use(morgan('dev'))

//fungsi middleware
app.use((req, res, next) => {
  console.log('Time:', Date.now())
  next()
})

//untuk memanggil file static dan semua ditangani oleh path public)
app.use(express.static(path.join(__dirname, 'public')))

// app.set('layout','layouts/layout')
// routing untuk path pada browser
app.get('/', (req,res) => {
  res.render('index', {
    layout : "layouts/main",
    title : "Halaman Index"
  })
})

//routing untuk path pada browser
app.get('/about', (req, res) => {
  res.render('about', {
    layout : "layouts/main",
    title : "Halaman About"
  })
})

//routing untuk path pada browser
app.get('/contact', (req, res) => {
  const cont = func.readJSON()
  console.log(cont); //opsional
  res.render('contact', {
    layout : "layouts/main",
    title : "Halaman Contact",
    cont,
  })
})

//routing untuk path add contact
app.get('/contact/add', (req, res) => {
  res.render('add-contact', {
    layout : "layouts/main",
    title : "Add new contact"
  })
});

app.post('/contact',
  //cek validasi email dan phone menggunakan check untuk mendapatkan custom alert message dari parameter kedua fungsi check 
  //ex : check('name(from form input name)', 'error message')
  check('name').custom(value => {
    const duplicate = func.duplicate_data(value)
    if(duplicate){
      throw new Error('nama yang ditambahkan sudah terdaftar')
    }
    return true
  }),
  check('email', 'email salah').isEmail(),  
  check('phone', 'nomor telepon tidak sesuai format').isMobilePhone('id-ID'), 
  (req, res) => {
  //cek apakah ada kesalahan validasi dalam request ini
  const errors = validationResult(req);
  //cek apakah ada inputan yang tidak sesuai format
  if (!errors.isEmpty()) {
    res.render('add-contact', {
      layout : "layouts/main",
      title : "Add new contact",
      errors : errors.array() //menampilkan errors dalam bentuk array
    })
    // return res.status(400).json({ errors: errors.array() });
  }else{ //jika semua input sudah sesuai format, akan menjalankan fungsi data_add
    // console.log(req.body);
    const name = req.body.name
    const phone = req.body.phone
    const email = req.body.email
    func.data_add(name, email, phone)
    res.redirect('/contact') //redirected ke halaman contact dan mengirimkan data jika memang semua format data benar
  }
});

//route untuk melakukan penghapusan data
app.get('/contact/delete/:name', (req, res) => {
  const cont = func.findContact(req.params.name) 
  //cek error handling
  if(!cont){
    res.status(404)
    res.send('gagal menghapus file')
  } else{
    func.del_data(req.params.name)
    res.redirect('/contact')
  }
})

//route untuk melakukan edit data
app.get('/contact/edit/:name', (req, res) => {
  const cont = func.findContact(req.params.name)
  res.render('edit-data', {
    layout : "layouts/main",
    title : "Edit data",
    cont
  })
});

// route untuk melakukan updating data
app.post('/contact/update',
  //cek validasi email dan phone menggunakan check untuk mendapatkan custom alert message dari parameter kedua fungsi check 
  //ex : check('name(from form input name)', 'error message')
  check('name').custom((value, {req}) => { //value disini diambil dari atribut name yang ada di form
    const duplicate = func.duplicate_data(value)
    //cek apakah nama lama sesuai dengan nama yang baru dikirim
    if(value !== req.body.oldName && duplicate){ //jika nama tidak sama
      //munculkan pesan error
      throw new Error('nama yang mau diubah sudah terdaftar')   
    }
    return true
  }),
  check('email', 'email salah').isEmail(),  
  check('phone', 'nomor telepon tidak sesuai format').isMobilePhone('id-ID'), 
  (req, res) => {
  //cek apakah ada kesalahan validasi dalam request ini
  const errors = validationResult(req);
  //cek apakah ada inputan yang tidak sesuai format
  if (!errors.isEmpty()) {
    res.render('edit-data', {
      layout : "layouts/main",
      title : "Form ubah data",
      errors : errors.array(), //menampilkan errors dalam bentuk array
      cont : req.body
    })
    // return res.status(400).json({ errors: errors.array() });
  }else{ //jika semua input sudah sesuai format, akan menjalankan fungsi data_add
    func.updt_data(req.body)
    res.redirect('/contact') //redirected ke halaman contact dan mengirimkan data jika memang semua format data benar
    // res.send(req.body)
    // console.log(req.body);
    // const name = req.body.name
    // const phone = req.body.phone
    // const email = req.body.email
    // func.data_add(name, email, phone)
    // func.updt_data(req.body)
  }
});

//routing untuk path pada browser
app.get('/contact/:name', (req, res) => {
  //untuk mengirimkan nilai ke parameter dengan menggunakan req.params (contoh kasus disini menggunakan :name)
  const cont = func.findContact(req.params.name) 
  const url = req.params.name
  res.render('detail', {
    layout : "layouts/main",
    title : "Halaman Detail",
    cont,
    url
  })
})

//route untuk menunjukkan status code 404 jika path url tidak ditentukan
app.use('/', (req, res) => {
  res.status(404)
  res.send('page not found')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})  