function submitData(){
    
    let name = document.getElementById("input-name").value

    console.log(name);

    let phonenumber = document.getElementById("input-number").value

    console.log(phonenumber);

    let email = document.getElementById("input-email").value

    console.log(email);

    let status = document.getElementById("input-status").value

    console.log(status);

    let messages = document.getElementById("input-messages").value

    console.log(messages);

    let aggreement1 = document.getElementById("aggreement1").checked
    let aggreement2= document.getElementById("aggreement2").checked

    if(aggreement1){
        aggreement1 = (document.getElementById("aggreement1").value);
    } else{
        aggreement1 = ""
    }

    if(aggreement2){
        aggreement2 = (document.getElementById("aggreement2").value);
    } else{
        aggreement2 = ""
    }

    console.log(aggreement1)
    console.log(aggreement2)

    let dataObject = {
        name: name,
        phonenumber: phonenumber,
        email: email,
        status: status,
        messages: messages,
        aggreement1: aggreement1,
        aggreement2: aggreement2    
    }

    console.log(dataObject)

    // condition

    if(name == ""){
        alert("Nama wajib diisi")
    } else if(phonenumber == ""){
        alert("Nomor telephone wajib diisi")
    } else if(email == ""){
        alert("Email wajib diisi")
    } else if(status == ""){
        alert("Status wajib diisi")
    } else if(messages == ""){
        alert("Message wajib diisi")
    } else if(aggreement1 == ""){
        alert("Mohon baca syarat dan ketentuan yang berlaku")
    } else if(aggreement2 == ""){
        alert("Mohon setujui syarat dan ketentuan yang berlaku")
    } else {
        let emailReceiver = "ramapnj81@gmail.com"

        let a = document.createElement("a")

        a.href = `mailto: ${emailReceiver}?subject=${status}&body=Hallo my name is ${name} ${messages} Please contact me on ${phonenumber} and Send the Confirmation to ${email}`
        a.click()      
    }
}
