// const request = require('request');
// const kb = require('./keyboard-buttons')
// const frases = require('./frases');
const keyboards = require('./keyboard.js');
const database = require('./database')
const frases = require('./frases');

/*git rm -r --cached FolderName
git commit -m "Removed folder from repository"
git push origin master*/

module.exports = {
    convert_date(date, offset) {
        offset = (offset === undefined) ? 0 : offset;
        date.setDate(date.getDate()+offset);
        return date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2)
    },

}


