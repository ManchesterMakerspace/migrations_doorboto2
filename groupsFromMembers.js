// migration that looks a member docs and creates a seperate groups collection
// run this file tunneling target mongo into localhost:27017 and running 'mongo groupsFromMembers.js'

var db = connect('localhost:27017/makerauth');

var cursor = db.members.find({'groupKeystone': true}); // find all that are group keystones
var numberOfGroupsMade = 0;
while(cursor.hasNext()){
    numberOfGroupsMade++;
    var keystoneMember = cursor.next();
    var groupDoc = {
        groupRep: keystoneMember.fullname,
        groupName: keystoneMember.groupName,
        expiry: NumberLong(keystoneMember.expirationTime)
    };
    // db.groups.insert(groupDoc);
    db.groups.update({groupName: groupDoc.groupName}, groupDoc);
}

print(numberOfGroupsMade + ' groups made');

// TODO clean up deprecated feilds from member docs
