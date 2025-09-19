"use client";
import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [title, setTitle] = useState('');
  const [secondaryTitle, setSecondaryTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageSrc, setImageSrc] = useState('');
  const [imageCredit, setImageCredit] = useState('');
  const [galleryImages, setGalleryImages] = useState([{ src: '', credit: '' }]);
  const [youtubeId, setYoutubeId] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [surveyQuestion, setSurveyQuestion] = useState('');
  const [surveyAnswers, setSurveyAnswers] = useState(['', '']);
  const [relevantArticles, setRelevantArticles] = useState([{ title: '', url: '' }]);
  const [generatedHtml, setGeneratedHtml] = useState('');
  const [previewContent, setPreviewContent] = useState('');

  const contentRef = useRef(null);

  const addBbCode = (tagStart, tagEnd = '') => {
    const textarea = contentRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = `${content.substring(0, start)}${tagStart}${selectedText}${tagEnd}${content.substring(end)}`;
    setContent(newText);
    textarea.focus();
    textarea.setSelectionRange(start + tagStart.length, start + tagStart.length + selectedText.length);
  };
  
    const addList = (type) => {
        const textarea = contentRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = content.substring(start, end);
        const listItems = selectedText.split('\n').map(item => `[*]${item}`).join('\n');
        const listBbCode = `[LIST=${type}]\n${listItems}\n[/LIST]`;
        const newText = `${content.substring(0, start)}${listBbCode}${content.substring(end)}`;
        setContent(newText);
        textarea.focus();
    };


  const handleGalleryChange = (index, field, value) => {
    const newGalleryImages = [...galleryImages];
    newGalleryImages[index][field] = value;
    setGalleryImages(newGalleryImages);
  };

  const addGalleryImage = () => {
    setGalleryImages([...galleryImages, { src: '', credit: '' }]);
  };

  const handleSurveyAnswerChange = (index, value) => {
    const newAnswers = [...surveyAnswers];
    newAnswers[index] = value;
    setSurveyAnswers(newAnswers);
  };

  const addSurveyAnswer = () => {
    setSurveyAnswers([...surveyAnswers, '']);
  };

  const handleRelevantArticleChange = (index, field, value) => {
    const newArticles = [...relevantArticles];
    newArticles[index][field] = value;
    setRelevantArticles(newArticles);
  };

  const addRelevantArticle = () => {
    setRelevantArticles([...relevantArticles, { title: '', url: '' }]);
  };

  const generateHtml = async () => {
    try {
      const response = await fetch('/ArticleHtmlTemplate.txt');
      let template = await response.text();
      
      // Basic Replacements
      template = template.replace(/{TITLE}/g, title);
      template = template.replace(/{SECONDARY_TITLE}/g, secondaryTitle);

      // Main Image
      const mainImageHtml = imageSrc ? `<div class="image-container"><img src="${imageSrc}" alt="${title}" style="width:100%;"><div class="image-credit">${imageCredit}</div></div>` : '';
      template = template.replace(/{IMAGE}/g, mainImageHtml);

      // Content and First Letter
      let finalContent = content.replace(/\n/g, '<br />');
        
        // BBCode to HTML conversion
        finalContent = finalContent
            .replace(/\[B\](.*?)\[\/B\]/gi, '<strong>$1</strong>')
            .replace(/\[I\](.*?)\[\/I\]/gi, '<em>$1</em>')
            .replace(/\[U\](.*?)\[\/U\]/gi, '<u>$1</u>')
            .replace(/\[S\](.*?)\[\/S\]/gi, '<strike>$1</strike>')
            .replace(/\[COLOR=&quot;(.*?)&quot;\](.*?)\[\/COLOR\]/gi, '<span style="color:$1;">$2</span>')
            .replace(/\[SIZE=&quot;(.*?)&quot;\](.*?)\[\/SIZE\]/gi, '<font size="$1">$2</font>')
            .replace(/\[URL=&quot;(.*?)&quot;\](.*?)\[\/URL\]/gi, '<a href="$1" target="_blank">$2</a>')
            .replace(/\[IMG\](.*?)\[\/IMG\]/gi, '<img src="$1" style="max-width:100%;">')
            .replace(/\[LIST=1\]([\s\S]*?)\[\/LIST\]/gi, (match, p1) => `<ol>${p1.replace(/\[\*\](.*?)(<br \/>|$)/gi, '<li>$1</li>')}</ol>`)
            .replace(/\[LIST\]([\s\S]*?)\[\/LIST\]/gi, (match, p1) => `<ul>${p1.replace(/\[\*\](.*?)(<br \/>|$)/gi, '<li>$1</li>')}</ul>`);

      if (finalContent.length > 0) {
        const firstLetter = finalContent.charAt(0);
        const restOfContent = finalContent.substring(1);
        template = template.replace(/{FIRST_LETTER}/g, `<span class="first-letter">${firstLetter}</span>`);
        template = template.replace(/{CONTENT}/g, restOfContent);
      } else {
        template = template.replace(/{FIRST_LETTER}/g, '');
        template = template.replace(/{CONTENT}/g, '');
      }
      
      // Gallery
      const galleryHtml = galleryImages
        .filter(img => img.src)
        .map(img => `<div class="gallery-image"><img src="${img.src}"><div class="gallery-credit">${img.credit}</div></div>`)
        .join('');
      template = template.replace(/{ADDITIONAL_IMAGES}/g, galleryHtml ? `<div class="gallery-container">${galleryHtml}</div>` : '');

      // Embeds
      const youtubeHtml = youtubeId ? `<div class="embed-container"><iframe width="560" height="315" src="https://www.youtube.com/embed/${youtubeId}" frameborder="0" allowfullscreen></iframe></div>` : '';
      template = template.replace(/{YOUTUBE}/g, youtubeHtml);
      
      const instagramHtml = instagramUrl ? `<div class="embed-container"><iframe src="${instagramUrl}embed" width="400" height="480" frameborder="0" scrolling="no" allowtransparency="true"></iframe></div>` : '';
       template = template.replace(/{INSTAGRAM}/g, instagramHtml);

      const facebookHtml = facebookUrl ? `<div class="embed-container"><iframe src="https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(facebookUrl)}&show_text=true&width=500" width="500" height="600" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe></div>` : '';
        template = template.replace(/{FACEBOOK}/g, facebookHtml);

      const twitterHtml = twitterUrl ? `<blockquote class="twitter-tweet"><a href="${twitterUrl}"></a></blockquote><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>`: '';
        template = template.replace(/{TWITTER}/g, twitterHtml);

      // Survey
      const surveyAnswersHtml = surveyAnswers
        .filter(answer => answer)
        .map(answer => `<div class="survey-answer">${answer}</div>`)
        .join('');
      const surveyHtml = surveyQuestion ? `<div class="survey-container"><h3>${surveyQuestion}</h3>${surveyAnswersHtml}</div>` : '';
      template = template.replace(/{SURVEY}/g, surveyHtml);

      // Relevant Articles
      const relevantArticlesHtml = relevantArticles
        .filter(article => article.title && article.url)
        .map(article => `<div class="relevant-article"><a href="${article.url}" target="_blank">${article.title}</a></div>`)
        .join('');
      template = template.replace(/{RELEVANT_ARTICLES}/g, relevantArticlesHtml ? `<div class="relevant-articles-container"><h3>כתבות נוספות שיעניינו אותך</h3>${relevantArticlesHtml}</div>` : '');
      
      // Footer (example)
      template = template.replace(/{FOOTER}/g, '<div class="footer-container">כל הזכויות שמורות © 2025</div>');

      setGeneratedHtml(template);
      setPreviewContent(template);

    } catch (error) {
      console.error('Error generating HTML:', error);
      setGeneratedHtml('<p>Error loading template.</p>');
    }
  };

  useEffect(() => {
    generateHtml();
  }, [title, secondaryTitle, content, imageSrc, imageCredit, galleryImages, youtubeId, instagramUrl, facebookUrl, twitterUrl, surveyQuestion, surveyAnswers, relevantArticles]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedHtml).then(() => {
      alert('HTML code copied to clipboard!');
    }, (err) => {
      alert('Failed to copy text: ', err);
    });
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8 bg-gray-900 text-white">
      <div className="z-10 w-full max-w-7xl items-center justify-between font-mono text-sm lg:flex flex-col">
        <h1 className="text-4xl font-bold mb-8">מחולל כתבות</h1>

        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">תוכן</h2>
            
            <div className="mb-4">
              <label className="block mb-2">כותרת הכתבה</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-2 bg-gray-700 rounded"/>
            </div>

            <div className="mb-4">
                <label className="block mb-2">Content</label>
                <div className="flex flex-wrap gap-2 mb-2">
                    <button onClick={() => addBbCode('[B]', '[/B]')} className="bg-gray-600 px-3 py-1 rounded">Bold</button>
                    <button onClick={() => addBbCode('[I]', '[/I]')} className="bg-gray-600 px-3 py-1 rounded">Italic</button>
                    <button onClick={() => addBbCode('[U]', '[/U]')} className="bg-gray-600 px-3 py-1 rounded">Underline</button>
                    <button onClick={() => addBbCode('[S]', '[/S]')} className="bg-gray-600 px-3 py-1 rounded">Strike</button>
                    <button onClick={() => {const url = prompt("Enter URL:"); if(url) addBbCode(`[URL="${url}"]`, '[/URL]')}} className="bg-gray-600 px-3 py-1 rounded">Link</button>
                    <button onClick={() => {const color = prompt("Enter color (e.g., red or #FF0000):"); if(color) addBbCode(`[COLOR="${color}"]`, '[/COLOR]')}} className="bg-gray-600 px-3 py-1 rounded">Color</button>
                    <button onClick={() => addList('1')} className="bg-gray-600 px-3 py-1 rounded">Ordered List</button>
                    <button onClick={() => addList('')} className="bg-gray-600 px-3 py-1 rounded">Unordered List</button>
                </div>
                <textarea ref={contentRef} value={content} onChange={(e) => setContent(e.target.value)} className="w-full p-2 bg-gray-700 rounded h-48" />
            </div>

            <div className="mb-4">
              <label className="block mb-2">Main Image</label>
              <input type="text" placeholder="Image URL" value={imageSrc} onChange={(e) => setImageSrc(e.target.value)} className="w-full p-2 bg-gray-700 rounded mb-2"/>
              <input type="text" placeholder="Image Credit" value={imageCredit} onChange={(e) => setImageCredit(e.target.value)} className="w-full p-2 bg-gray-700 rounded"/>
            </div>

            <div className="mb-4">
              <label className="block mb-2">Image Gallery</label>
              {galleryImages.map((img, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input type="text" placeholder="Image URL" value={img.src} onChange={(e) => handleGalleryChange(index, 'src', e.target.value)} className="w-1/2 p-2 bg-gray-700 rounded"/>
                  <input type="text" placeholder="Image Credit" value={img.credit} onChange={(e) => handleGalleryChange(index, 'credit', e.target.value)} className="w-1/2 p-2 bg-gray-700 rounded"/>
                </div>
              ))}
              <button onClick={addGalleryImage} className="bg-blue-600 px-4 py-2 rounded">Add Image to Gallery</button>
            </div>
            
             <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2">Embeds</h3>
                <input type="text" placeholder="YouTube Video ID" value={youtubeId} onChange={(e) => setYoutubeId(e.target.value)} className="w-full p-2 bg-gray-700 rounded mb-2"/>
                <input type="text" placeholder="Instagram Post URL" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} className="w-full p-2 bg-gray-700 rounded mb-2"/>
                <input type="text" placeholder="Facebook Post URL" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} className="w-full p-2 bg-gray-700 rounded mb-2"/>
                <input type="text" placeholder="Twitter (X) Post URL" value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} className="w-full p-2 bg-gray-700 rounded"/>
            </div>


            <div className="mb-4">
              <label className="block mb-2">Survey</label>
              <input type="text" placeholder="Survey Question" value={surveyQuestion} onChange={(e) => setSurveyQuestion(e.target.value)} className="w-full p-2 bg-gray-700 rounded mb-2"/>
              {surveyAnswers.map((answer, index) => (
                 <input key={index} type="text" placeholder={`Answer ${index + 1}`} value={answer} onChange={(e) => handleSurveyAnswerChange(index, e.target.value)} className="w-full p-2 bg-gray-700 rounded mb-2"/>
              ))}
              <button onClick={addSurveyAnswer} className="bg-blue-600 px-4 py-2 rounded">Add Answer</button>
            </div>
            
            <div className="mb-4">
                <label className="block mb-2">Relevant Articles</label>
                {relevantArticles.map((article, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                        <input type="text" placeholder="Article Title" value={article.title} onChange={(e) => handleRelevantArticleChange(index, 'title', e.target.value)} className="w-1/2 p-2 bg-gray-700 rounded"/>
                        <input type="text" placeholder="Article URL" value={article.url} onChange={(e) => handleRelevantArticleChange(index, 'url', e.target.value)} className="w-1/2 p-2 bg-gray-700 rounded"/>
                    </div>
                ))}
                <button onClick={addRelevantArticle} className="bg-blue-600 px-4 py-2 rounded">Add Article</button>
            </div>


          </div>

          {/* Preview and HTML Section */}
          <div className="bg-gray-800 p-6 rounded-lg">
             <h2 className="text-2xl font-semibold mb-4">Preview</h2>
             <div className="bg-white text-black p-4 rounded-lg h-96 overflow-y-auto mb-4" dangerouslySetInnerHTML={{ __html: previewContent }}></div>
             
             <h2 className="text-2xl font-semibold mb-4">Generated HTML</h2>
             <textarea readOnly value={generatedHtml} className="w-full p-2 bg-gray-700 rounded h-48 mb-4"/>
             <button onClick={copyToClipboard} className="w-full bg-green-600 px-4 py-2 rounded">Copy HTML Code</button>
          </div>
        </div>
      </div>
       <style jsx global>{`
            /* styleMain.css content */
            body {
                direction: rtl;
                font-family: Arial, Helvetica, sans-serif;
            }
            .article-container {
                max-width: 800px;
                margin: auto;
                padding: 20px;
                background-color: #f9f9f9;
                border: 1px solid #ddd;
            }
            .article-header h1 {
                font-size: 2.5em;
                margin: 0;
            }
            .article-header h2 {
                font-size: 1.5em;
                color: #555;
                margin-top: 5px;
            }
            .article-content {
                margin-top: 20px;
                line-height: 1.6;
                font-size: 1.1em;
            }
            .first-letter {
                float: right;
                font-size: 4em;
                line-height: 1;
                margin-left: 10px;
                font-weight: bold;
            }
            .image-container, .gallery-image, .embed-container {
                margin: 20px 0;
                text-align: center;
            }
            .image-credit, .gallery-credit {
                font-size: 0.9em;
                color: #777;
                text-align: center;
                margin-top: 5px;
            }
            .gallery-container {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                justify-content: center;
            }
            .gallery-image img {
                max-width: 100%;
                height: auto;
            }
            .survey-container {
                background-color: #f0f0f0;
                border: 1px solid #ccc;
                padding: 15px;
                margin: 20px 0;
            }
            .survey-answer {
                padding: 10px;
                background-color: #fff;
                border: 1px solid #ddd;
                margin-top: 5px;
            }
            .relevant-articles-container {
                 margin-top: 30px;
            }
            .relevant-article a {
                text-decoration: none;
                color: #0056b3;
            }
            .footer-container {
                margin-top: 30px;
                text-align: center;
                font-size: 0.8em;
                color: #888;
            }
            iframe { max-width: 100%; }
        `}</style>
    </main>
  );
}