// migration that looks a member docs and creates card doc for doorboto2 to read
// run this file tunneling target mongo into localhost:27017 and running mongo membersToCards.js

var db = connect('localhost:27017/makerauth');

var cursor = db.members.find({});
var numberOfCardsMade = 0;
while(cursor.hasNext()){
    var memberDoc = cursor.next();
    numberOfCardsMade++;
    print('making card ' + numberOfCardsMade + ' for ' + memberDoc.fullname);
    var trueExpiry = memberDoc.expirationTime;
    if(memberDoc.groupName){
        var keystone = db.members.find({'groupName': memberDoc.groupName, 'groupKeystone': true});
        keystone = keystone.next(); // only look at first possible result for above params, boy I would hope thats unique
        print('Looking at ' + keystone.fullname + ' to get expiry for ' + memberDoc.fullname);
        trueExpiry = keystone.expirationTime; // be sure we get true expiration for individual group members
    }

    if(typeof trueExpiry !== 'object'){
        trueExpiry = NumberLong(trueExpiry);
    }

    var memberId = memberDoc._id.valueOf(); // convert mongo _id object to just be the string value of the oid

    var cardDoc = {
        uid: memberDoc.cardID,
        holder: memberDoc.fullname,
        memberId: memberId,
        // cardToken: '', // TODO make this shit up, probably in a future migration where we add unique tokens
        expiry: trueExpiry,
        validity: new Date().getTime() > trueExpiry ? 'expired' : 'activeMember' // current greater than expiry mark validity as expired
    };
    db.cards.insert(cardDoc);
    // db.cards.update({uid: cardDoc.uid}, cardDoc); // used this to debug initial mess ups
}

print(numberOfCardsMade + ' cards were made');
