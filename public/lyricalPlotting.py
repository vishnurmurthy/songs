#import matplotlib.pyplot as plt; plt.rcdefaults()
import numpy as np
#import matplotlib.pyplot as plt
from numpy import array
import requests, sys, codecs, json
from bs4 import BeautifulSoup, Comment, NavigableString

class Track(object):
	def __init__(self,trackName,album,artist):
		self.name = trackName
		self.album = album
		self.artist = artist
	def __repr__(self):
		return self.name
	def link(self):
		return 'http://lyrics.wikia.com/{0}:{1}'.format(self.artist.replace(' ', '-'),self.name.replace(' ','-'))
	def getLyrics(self):
		return PyLyrics.getLyrics(self.artist,self.name)
class Artist(object):
	def __init__(self, name):
		self.name = name 
	def getAlbums(self):
		return PyLyrics.getAlbums(self.name)
	def __repr__(self):
		return self.name.encode('utf-8')
class Album(object):
	def __init__(self, name, link,singer):
		self.year = name.split(' ')[-1]
		self.name = name.replace(self.year,' ').rstrip()
		self.url = link 
		self.singer = singer
	def link(self):
		return self.url 
	def __repr__(self):
		if sys.version_info[0] == 2:
				return self.name.encode('utf-8','replace')
		return	self.name
	def artist(self):
		return self.singer
	def tracks(self):
		return PyLyrics.getTracks(self)

class PyLyrics:
	@staticmethod
	def getAlbums(singer):
		singer = singer.replace(' ', '_')
		s = BeautifulSoup(requests.get('http://lyrics.wikia.com/{0}'.format(singer)).text)
		spans = s.findAll('span',{'class':'mw-headline'})
		
		als = []
		
		for tag in spans:
			try:
				a = tag.findAll('a')[0]
				als.append(Album(a.text,'http://lyrics.wikia.com' + a['href'],singer))
			except:
				pass
		
		if als == []:
			raise ValueError("Unknown Artist Name given")
			return None
		return als
	@staticmethod 
	def getTracks(album):
		url = "http://lyrics.wikia.com/api.php?action=lyrics&artist={0}&fmt=xml".format(album.artist())
		soup = BeautifulSoup(requests.get(url).text)

		for al in soup.find_all('album'):
			if al.text.lower().strip() == album.name.strip().lower():
				currentAlbum = al
				break
		songs =[Track(song.text,album,album.artist()) for song in currentAlbum.findNext('songs').findAll('item')]
		return songs

	@staticmethod
	def getLyrics(singer, song):
		#Replace spaces with _
		singer = singer.replace(' ', '_')
		song = song.replace(' ', '_')
		r = requests.get('http://lyrics.wikia.com/{0}:{1}'.format(singer,song))
		s = BeautifulSoup(r.text)
		#Get main lyrics holder
		lyrics = s.find("div",{'class':'lyricbox'})
		if lyrics is None:
			raise ValueError("Song or Singer does not exist or the API does not have Lyrics")
			return None
		#Remove Scripts
		[s.extract() for s in lyrics('script')]

		#Remove Comments
		comments = lyrics.findAll(text=lambda text:isinstance(text, Comment))
		[comment.extract() for comment in comments]

		#Remove unecessary tags
		for tag in ['div','i','b','a']:
			for match in lyrics.findAll(tag):
				match.replaceWithChildren()
		#Get output as a string and remove non unicode characters and replace <br> with newlines
		output = str(lyrics).encode('utf-8', errors='replace')[22:-6:].decode("utf-8").replace('\n','').replace('<br/>','\n')
		try:
			return output
		except:
			return output.encode('utf-8')

def getOccurences(artist, track, words):
    count = 0
    clyrics = getLyrics(artist,track)
    for word in words:
        count+=clyrics.count(word)
    return count+1
    
def profaneCounter(songsText, words):
    for word in words:
        count+=songsText.count(word)
    return count+1
######################################################################
 
input =  "".join(map(chr, sys.stdin.buffer.read())) 

#print("input", input)

input_string = json.loads(input)[0]

#print("input_string", input_string)
#input_string = "Taylor Swift"
artist= input_string
words = []
f = open('swearWords.txt','r')
for line in f:
    words.append(line.strip()) # We don't want newlines in our list, do we?
    
albums = PyLyrics.getAlbums(singer=artist)
#print("albums",albums)
totalLyrics=""
jsonList= []
for curralbum in albums:
    try:
        intensity=0
        name = curralbum
        tL = curralbum.tracks()
        #print (tL)
        for currtrack in tL:
            totalLyrics+= PyLyrics.getLyrics(artist,currtrack.__repr__())
        for word in words:
            intensity+=totalLyrics.count(word)
            #print(intensity)
        #print ('working till here1')
        temp = dict()
        #print ('working till here2')
        temp['name'] = str(name)
        #print ('workicng till here3')
        temp['trackList']= str(tL)
        #print ('working till here4')
        temp['intensity'] = str(intensity)
        #print ('working till here5')
        jsonList.append(temp)
        #print("jlist",jsonList)
        #print ('working till here6')
        
    except:
        #print("oh no")
        temp = dict()
        temp['name'] = "Sorry we couldn't get the info yout wanted bc of our API! Sorry!"
        temp['trackList']="N/A"
        temp['intensity'] = "N/A"
        jsonList.append(temp)
    
#print (jsonList)

finalJson = dict()
finalJson['albums'] = jsonList
#print(finalJson)
#print("finalJson", finalJson)

jdump = json.dumps(finalJson)
#print("dump",jdump)
#print("jsondumps", jdump, type(jdump))
#finalJsonStr= "{ \"albums\": " + "".join(str(jsonList)) + "}\'"#replace("\"","")
#finalJsonStr= finalJsonStr.replace("\"","")


sys.stdout.write(jdump)


#sys.stdout.write("testwrite")

