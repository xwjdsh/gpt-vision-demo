import './App.css';

import {
  React,
  useRef,
  useState,
} from 'react';

import Markdown from 'react-markdown';

import { IconUpload } from '@douyinfe/semi-icons';
import {
  Button,
  Input,
  Spin,
  Toast,
  Upload,
} from '@douyinfe/semi-ui';

function App() {
  let imageOnly = 'image/*';
  let limit = 1;
  const [prompt, setPrompt] = useState("分析下这张k线图。");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const uploadRef = useRef();

  const getBase64 = async function (file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        resolve(reader.result)
      }
      reader.onerror = reject
    })
  }

  const uploadRequest = async ({ file, onProgress, onError, onSuccess }) => {
    let base64String = ''
    await getBase64(file.fileInstance)
      .then(res => base64String = res)
      .catch(err => console.log(err))
    base64String = base64String.replace('data:', '')
      .replace(/^.+,/, '');

    const data = {
      model: "gpt-4-vision-preview",
      messages: [
        {
          "role": "user",
          "content": [
            {
              "type": "text",
              "text": `${prompt}`
            },
            {
              "type": "image_url",
              "image_url": {
                "url": `data:image/jpeg;base64,${base64String}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000
    };

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
        },
        body: JSON.stringify(data),
        mode: "cors",
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const apiResponse = await response.json();
      console.log(apiResponse)

      if (apiResponse.choices && apiResponse.choices.length > 0) {
        setResult(apiResponse.choices[0].message.content);
      } else {
        throw new Error("No response from API");
      }
    } catch (e) {
      setLoading(false);
      Toast.error(e.message);
    }
    setLoading(false);
  };

  const inputOnchange = (value, e) => {
    setPrompt(value);
  };

  const onClick = async () => {
    if (uploadRef.current.state.fileList.length === 0) {
      Toast.warning("请先选择图片")
      return
    }
    setResult("");
    setLoading(true);
    uploadRef.current.upload();
  };

  return (
    <div className="App">
      <Upload action="/" uploadTrigger="custom" customRequest={uploadRequest} ref={uploadRef} accept={imageOnly} limit={limit} maxSize={1024 * 20}>
        <Button icon={<IconUpload />} theme="light">
          选择图片
        </Button>
      </Upload>

      <Input value={prompt} onChange={inputOnchange} style={{ width: 350 }} />
      { !loading && <Button onClick={onClick}>确定</Button>}
      <Spin size="middle" spinning={loading} />

      {result && <Markdown className='result'>{result}</Markdown>}
    </div>
  );
}

export default App;
