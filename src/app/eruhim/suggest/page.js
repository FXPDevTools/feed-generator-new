"use client";
import { useState, useRef, useEffect } from "react";
import depts from "public/dept-config.json";
import BackButtons from "../../components/BackButtons";

// קומפוננטת עורך BBCode
const BbCodeEditor = ({ content, setContent }) => {
  const contentRef = useRef(null);
  return (
    <textarea ref={contentRef} value={content} onChange={e => setContent(e.target.value)} className="w-full p-2 bg-gray-700 rounded h-24" />
  );
};

export default function SuggestGuestPage() {
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [info, setInfo] = useState("");
  const [website, setWebsite] = useState("");
  const [opinion, setOpinion] = useState("");
  const [interest, setInterest] = useState("");
  const [contact, setContact] = useState("");
  const [notes, setNotes] = useState("");

  const [previewHtml, setPreviewHtml] = useState("");
  const [previewBBCode, setPreviewBBCode] = useState("");
  const deptConfig = depts["eruhim"]?.suggest;

  useEffect(() => {
    async function generatePreview() {
      // HTML
      if (deptConfig?.templateFile) {
        try {
          const htmlResponse = await fetch(deptConfig.templateFile);
          let htmlTemplate = await htmlResponse.text();
          htmlTemplate = htmlTemplate
            .replace(/{שם המתארח}/g, name)
            .replace(/{תחום האירוח}/g, topic)
            .replace(/{מידע על המתארח}/g, info.replace(/\n/g, '<br />'))
            .replace(/{אתר אינטרנט}/g, website)
            .replace(/{דעה אישית}/g, opinion.replace(/\n/g, '<br />'))
            .replace(/{מדוע האירוח יעניין את הקהילה}/g, interest.replace(/\n/g, '<br />'))
            .replace(/{דרכים ליצירת קשר}/g, contact)
            .replace(/{הערות}/g, notes.replace(/\n/g, '<br />'));
          setPreviewHtml(htmlTemplate);
        } catch {
          setPreviewHtml('<div>שגיאה בטעינת תבנית HTML</div>');
        }
      }
      // BBCODE
      if (deptConfig?.bbcodeTemplateFile) {
        try {
          const bbcodeResponse = await fetch(deptConfig.bbcodeTemplateFile);
          let bbcodeTemplate = await bbcodeResponse.text();
          bbcodeTemplate = bbcodeTemplate
            .replace(/{שם המתארח}/g, name)
            .replace(/{תחום האירוח}/g, topic)
            .replace(/{מידע על המתארח}/g, info)
            .replace(/{אתר אינטרנט}/g, website)
            .replace(/{דעה אישית}/g, opinion)
            .replace(/{מדוע האירוח יעניין את הקהילה}/g, interest)
            .replace(/{דרכים ליצירת קשר}/g, contact)
            .replace(/{הערות}/g, notes);
          setPreviewBBCode(bbcodeTemplate);
        } catch {
          setPreviewBBCode('שגיאה בטעינת תבנית BBCODE');
        }
      }
    }
    generatePreview();
  }, [name, topic, info, website, opinion, interest, contact, notes, deptConfig]);

  const handleAnyChange = (setter) => (e) => {
    setter(e.target.value);
  };

  // העתקה
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text.trim()).then(() => alert('הקוד הועתק!'));
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8 bg-gray-900 text-white">
      <div className="z-10 w-full max-w-7xl items-center justify-between font-mono text-sm lg:flex flex-col">
        <BackButtons />
        <h1 className="text-4xl font-bold mb-8">הצעת אירוח לצוות</h1>
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* טופס */}
          <div className="bg-gray-800 p-6 rounded-lg space-y-4">
            <h2 className="text-2xl font-semibold mb-4">פרטי ההצעה</h2>
            <div><label className="block mb-2">שם המתארח</label><input type="text" value={name} onChange={handleAnyChange(setName)} className="w-full p-2 bg-gray-700 rounded" /></div>
            <div><label className="block mb-2">תחום האירוח</label><input type="text" value={topic} onChange={handleAnyChange(setTopic)} className="w-full p-2 bg-gray-700 rounded" placeholder="מה מיוחד באדם הזה? למה כדאי לארח אותו?" /></div>
            <div><label className="block mb-2">מידע על המתארח</label><BbCodeEditor content={info} setContent={setInfo} /></div>
            <div><label className="block mb-2">אתר אינטרנט / עמוד סושיאל</label><input type="text" value={website} onChange={handleAnyChange(setWebsite)} className="w-full p-2 bg-gray-700 rounded" placeholder="קישור לאתר או עמוד רשת חברתית" /></div>
            <div><label className="block mb-2">דעה אישית על המתארח</label><BbCodeEditor content={opinion} setContent={setOpinion} /></div>
            <div><label className="block mb-2">מדוע האירוח יעניין את הקהילה</label><BbCodeEditor content={interest} setContent={setInterest} /></div>
            <div><label className="block mb-2">דרכים ליצירת קשר</label><input type="text" value={contact} onChange={handleAnyChange(setContact)} className="w-full p-2 bg-gray-700 rounded" placeholder="מייל, טלפון, רשתות חברתיות וכו'" /></div>
            <div><label className="block mb-2">הערות</label><BbCodeEditor content={notes} setContent={setNotes} /></div>
          </div>
          {/* תצוגה מקדימה */}
          <div className="bg-gray-800 p-6 rounded-lg space-y-4">
            <div><h2 className="text-2xl font-semibold mb-2">תצוגה מקדימה (HTML)</h2><div className="w-full bg-white text-black p-4 rounded-lg h-80 overflow-y-auto" dangerouslySetInnerHTML={{ __html: previewHtml }}></div></div>
            <div><h2 className="text-2xl font-semibold mb-2">Generated BBCODE</h2>
              <textarea readOnly value={previewBBCode} className="w-full p-2 bg-gray-700 rounded h-32 mb-2" />
              <div className="flex gap-4">
                <button onClick={() => copyToClipboard(previewBBCode)} className="w-full bg-purple-600 px-4 py-2 rounded">העתק קוד BBCODE</button>
                <button
                  className="w-full bg-green-700 hover:bg-green-800 text-white font-bold px-4 py-2 rounded"
                  onClick={() => window.open('https://www.fxp.co.il/forumdisplay.php?f=10577', '_blank')}
                >
                  פתח חדר עבודה
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
