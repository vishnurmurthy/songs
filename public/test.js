stri = "test case"

strarr = stri.split(" ")
strarrnew = []

for (var i =0;i<strarr.length; i++)
{
    strarrnew.push(strarr[i].substring(0,1).toUpperCase() + strarr[i].substring(1,).toLowerCase())
}

stri = strarrnew.join(" ")
console.log(stri)