# songs
#Website
https://user.tjhsst.edu/songs/
#What It Does?
Artist Analyzer takes an artist you give, and gives you information about their albums, songs, and lyric use!
#How?
This data comes from the PyLyrics API that utilizes web scraping from http://lyrics.wikia.com/  and uses sys and handlebars to transfer the information to the front end. We also you with others with similar interest using oauth to get you username and storing yours and others interest in an sql database
#Future Considerations
We'd like to include more in depth analysis on artists' lyrics. Our original vision was making an intricate tool that analyzed and visualized the lyric choice or artists. We wanted to include everything from sentiment analysis to the frequency of different lyrics. Due to some restrictions with API's allowed, however, we had to limit what we could do. This extended to the API we were able to use- PyLyrics. PyLyrics was not only very slow, but also has a limited database of artists. A better choice would be to use the MusixMatch API, which doesn't have the Python API limitations as it's a javascript API and is also much quicker. This would also help us accommodate multiple people on the site at once as right now it's very slow with multiple users.
#Journal Entries
https://goo.gl/MXeGFo
