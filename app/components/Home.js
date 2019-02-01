// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import routes from '../constants/routes';
import styles from './Home.css';
import HID from 'node-hid';

type Props = {};

const VID_KEYWALLET = 9720;

export default class Home extends Component<Props> {
  props: Props;
  keywallet;

  state = {
    value: ''
  }

  buttonStyle = {
    height: 30, 
    width: 100,
    marginTop: 10,
    marginBottom: 10,
  };

  render() {
    return (
      <div className={styles.container} data-tid="container">
        <div>
          <h2>KeyWallet Test</h2>
        </div>

        <div>
          <button onClick={this.onConnect} style={this.buttonStyle}>Connect</button>
        </div>

        <div>
          <button onClick={this.onDisconnect} style={this.buttonStyle}>Disonnect</button>
        </div>

        <div>
          <input
          placeholder="hex string (e.g. 0f11420049042b09)"
          value={this.state.value}
          onChange={this.handleInput}
          style={{height: 30, width: 800}}
          />
        </div>

        <div>
          <button onClick={this.onSend} style={this.buttonStyle}>Send</button>
        </div>

        <div>
          <button onClick={this.onAutoSend} style={this.buttonStyle}>Auto Send</button>
        </div>

      </div>
    );
  }

  hexStrToByteArr = (hexStr) => {
    hexStr = hexStr.replace(/ /g, '');
  
    if (hexStr.slice(0, 2).toLowerCase() === '0x')
      hexStr = hexStr.slice(2, hexStr.length);
    const bin = [];
    let i;
    let c;
    let isEmpty = 1;
    let buffer;
    for (i = 0; i < hexStr.length; i++) {
      c = hexStr.charCodeAt(i);
      if ((c > 47 && c < 58) || (c > 64 && c < 71) || (c > 96 && c < 103)) {
        buffer = (buffer << 4) ^ ((c > 64 ? c + 9 : c) & 15);
        if ((isEmpty ^= 1)) {
          bin.push(buffer & 0xff);
        }
      }
    }
    return bin;
  }

  
  byteArrToHexStr = (byteArr) => {
    return Array.from(byteArr, byte =>
      `0${(byte & 0xff).toString(16)}`.slice(-2)
    ).join('');
  }


  handleInput = (e) => {
    this.setState({
      value: e.target.value
    });
  }


  onConnect = () => {
    if (this.keywallet) {
      this.onDisconnect();
    }

    const devices = HID.devices();
    const keywallets = devices.filter(
      device => device.vendorId === VID_KEYWALLET
    );

    // 1개 이상 키월렛이 발견되었을 경우 첫 번째 장치 연결
    if (keywallets.length > 0) {
      try {
        this.keywallet = new HID.HID(keywallets[0].path);
        this.keywallet.on('error', this.onDetached);
        this.keywallet.on('data', this.onDataReceived);
        console.log('키월렛이 연결되었습니다. ', this.keywallet);
      } catch(e) {
        alert('장치 연결 실패 ' +  e);
      }
    }
  }


  onDisconnect = () => {
    if (this.keywallet) {
      try {
        this.keywallet.close();
        this.keywallet = null;
        console.log('키월렛 연결이 해제되었습니다. ', this.keywallet);
      } catch(e) {

      }
    }
  }


  onDetached = () => {
    alert('장치가 분리되었습니다.');
    this.keywallet = null;
  }


  // 데이터 전송 함수
  onSend = () => {
    if (!this.keywallet) {
      alert('연결된 장치가 없습니다!');
      return;
    }

    try {
      const data = this.hexStrToByteArr(this.state.value);
      console.log('data(hex): ', this.state.value);
      //console.log('data(bytes): ', data);

      this.keywallet.write(data);
    } catch(e) {
      alert('데이터 전송 실패!');
    }
  }


  onAutoSend = () => {
    if (!this.keywallet) {
      alert('연결된 장치가 없습니다!');
      return;
    }

    const abOutReport = new Array(65).fill(0);
    abOutReport[1] = 0x35;
    abOutReport[2] = 0xe6;
    abOutReport[3] = 0x36;
    abOutReport[4] = 0x24;
    abOutReport[5] = 0xf7;
    abOutReport[6] = 0x1a;

    console.log('data(hex): ', this.byteArrToHexStr(abOutReport));
    this.keywallet.write(abOutReport);
  }


  // 데이터 수신 이벤트
  onDataReceived = (data) => {
    const result = data.slice(0, 64);
    console.log('onDataReceived result(hex): ', this.byteArrToHexStr(result));
    console.log('onDataReceived result(bytes): ', result);
  }
}
