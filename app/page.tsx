'use client'

import { useEffect, useState } from 'react'

export default function Home() {
  const [activeTab, setActiveTab] = useState('request')
  const [requester, setRequester] = useState('')
  const [lotNo, setLotNo] = useState('')
  const [sampleType, setSampleType] = useState('액체원료')
  const [requestList, setRequestList] = useState<any[]>([])
  const [judgement, setJudgement] = useState('')
  const [labelQty, setLabelQty] = useState('없음')
  const [manufacturerSupplier, setManufacturerSupplier] = useState('')
  const [receiveDate, setReceiveDate] = useState('')
  const [containerQty, setContainerQty] = useState('')
  const [totalQty, setTotalQty] = useState('')
  const [remarks, setRemarks] = useState('')
  const today = new Date().toISOString().split('T')[0]
  
  const [productName, setProductName] = useState('O0330')
  const [manufactureDate, setManufactureDate] = useState(today)
  const [requestDate, setRequestDate] = useState(today)
  const [department, setDepartment] = useState('음성공장 합성팀')
  const [judgementDate, setJudgementDate] = useState(today)
  

  useEffect(() => {
    const savedData = localStorage.getItem('requestList')
    if (savedData) {
      setRequestList(JSON.parse(savedData))
    }
  }, [])

  const generateRequestNo = (sampleType: string) => {
    const today = new Date()
    const year = String(today.getFullYear()).slice(-2)
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const datePart = `${year}${month}${day}`

    let prefixMap: { [key: string]: string } = {
  '액체원료': 'ER',
  '고체원료': 'ER',
  '제품': 'EP',
  '중간체': 'EB',
    }
    
    let prefix = prefixMap[sampleType] || 'ER'

    const sameDayCount = requestList.filter((item) =>
      item.requestNo?.startsWith(prefix + datePart)
    ).length

    const serial = String(sameDayCount + 1).padStart(2, '0')

    return `${prefix}${datePart}${serial}`
  }

  const saveData = () => {
    const autoRequestNo = generateRequestNo(sampleType)
    const autoReportNo = `Q${autoRequestNo}`

    const newItem = {
      requester,
      productName,
      lotNo,
      sampleType,
      manufacturerSupplier,
      manufactureDate,
      containerQty,
      totalQty,
      requestDate,
      department,
      remarks,
      judgementDate,
      judgement,
      labelQty,
      requestNo: autoRequestNo,
      reportNo: autoReportNo,
      
    }

    const updatedList = [...requestList, newItem]

    setRequestList(updatedList)
    localStorage.setItem('requestList', JSON.stringify(updatedList))

    alert(`저장 완료\n의뢰번호: ${autoRequestNo}`)
  }

  const deleteItem = (index: number) => {
  const confirmDelete = window.confirm(
    '선택한 의뢰를 삭제하시겠습니까?'
  )

  if (!confirmDelete) return

  const updatedList = requestList.filter(
    (_, i) => i !== index
  )

  setRequestList(updatedList)

  localStorage.setItem(
    'requestList',
    JSON.stringify(updatedList)
  )
}

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">
        시험 의뢰 관리 시스템
      </h1>

      <div className="flex gap-3 mb-8">
        <button
          onClick={() => setActiveTab('request')}
          className="border px-4 py-2"
        >
          시험의뢰
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className="border px-4 py-2"
        >
          접수대장
        </button>
        <button
          onClick={() => setActiveTab('result')}
          className="border px-4 py-2"
        >
          시험결과통보
        </button>
      </div>

      {activeTab === 'request' && (
  <div className="space-y-3">
    <select
      className="border p-2 w-full"
      value={productName}
      onChange={(e) => setProductName(e.target.value)}
    >
      <option value="O0330">O0330</option>
      <option value="O0711">O0711</option>
      <option value="O0731">O0731</option>
      <option value="O0830">O0830</option>
      <option value="G0720">G0720</option>
      <option value="LX0556">LX0556</option>
      <option value="LX0566">LX0566</option>
      <option value="DCPM-383">DCPM-383</option>
      <option value="HTM-K940">HTM-K940</option>
      <option value="LHT-6634">LHT-6634</option>
      <option value="GP-A079">GP-A079</option>
      <option value="ACT">ACT</option>
      <option value="EA">EA</option>
      <option value="EtOH(99.5%)">EtOH(99.5%)</option>
      <option value="MC">MC</option>
      <option value="MCB">MCB</option>
      <option value="THF">THF</option>
      <option value="MeOH">MeOH</option>
      <option value="TOL">TOL</option>
      <option value="Xylene">Xylene</option>
      <option value="HEP">HEP</option>
      <option value="EDC">EDC</option>
    </select>

    <input
      className="border p-2 w-full"
      placeholder="제조번호"
      value={lotNo}
      onChange={(e) => setLotNo(e.target.value)}
    />

    <input
      className="border p-2 w-full"
      placeholder="제조자 / 납품자"
      value={manufacturerSupplier}
      onChange={(e) =>
        setManufacturerSupplier(e.target.value)
      }
    />

    <input
      type="date"
      className="border p-2 w-full"
      value={manufactureDate}
      onChange={(e) =>
        setManufactureDate(e.target.value)
      }
    />

    <input
      className="border p-2 w-full"
      placeholder="용기 수량"
      value={containerQty}
      onChange={(e) =>
        setContainerQty(e.target.value)
      }
    />

    <input
      className="border p-2 w-full"
      placeholder="제조 / 입고 수량"
      value={totalQty}
      onChange={(e) =>
        setTotalQty(e.target.value)
      }
    />

    <input
      type="date"
      className="border p-2 w-full"
      value={requestDate}
      onChange={(e) =>
        setRequestDate(e.target.value)
      }
    />

    <select
      className="border p-2 w-full"
      value={department}
      onChange={(e) =>
        setDepartment(e.target.value)
      }
    >
      <option value="음성공장 합성팀">
        음성공장 합성팀
      </option>
      <option value="음성공장 품질팀">
        음성공장 품질팀
      </option>
      <option value="화성공장">
        화성공장
      </option>
    </select>

    <div className="mb-4">
  <label className="block mb-1 font-semibold">
    시험항목 종류
  </label>
  <select
    className="border p-2 w-full"
    value={sampleType}
    onChange={(e) => setRequestType(e.target.value)}
  >
    <option value="액체원료">액체원료</option>
    <option value="고체원료">고체원료</option>
    <option value="중간체">중간체</option>
    <option value="제품">제품</option>
  </select>
</div>

    <button
      onClick={saveData}
      className="bg-black text-white px-4 py-2"
    >
      저장
    </button>
  </div>
)}

      {activeTab === 'ledger' && (
  <div>
    <div className="mb-4 flex gap-3">
      <input
        type="text"
        placeholder="품목명 검색"
        className="border p-2"
        value={productName}
        onChange={(e) => setProductName(e.target.value)}
      />

      <select
        className="border p-2"
        value={sampleType}
        onChange={(e) => setSampleType(e.target.value)}
      >
        <option value="">전체 구분</option>
        <option value="액체원료">액체원료</option>
        <option value="제품">제품</option>
        <option value="중간체">중간체</option>
      </select>
    </div>

    <table className="w-full border text-sm">
      <thead>
        <tr>
          <th className="border p-2">No.</th>
          <th className="border p-2">시험항목</th>
          <th className="border p-2">의뢰일</th>
          <th className="border p-2">의뢰번호</th>
          <th className="border p-2">성적번호</th>
          <th className="border p-2">품명</th>
          <th className="border p-2">제조번호</th>
          <th className="border p-2">제조자/납품자</th>
          <th className="border p-2">제조/입고 일자</th>
          <th className="border p-2">용기수량</th>
          <th className="border p-2">입고수량</th>
          <th className="border p-2">의뢰부서</th>
          <th className="border p-2">비고</th>
          <th className="border p-2">삭제</th>
        </tr>
      </thead>
      <tbody>
        {requestList
          .filter((item) => {
            const productMatch =
              !productName ||
              item.productName?.includes(productName)

            const typeMatch =
              !sampleType ||
              item.sampleType === sampleType

            return productMatch && typeMatch
          })
          .map((item, index) => (
            <tr key={index}>
              <td className="border p-2">{index + 1}</td>
              <td className="border p-2">{item.sampleType}</td>
              <td className="border p-2">{item.requestDate}</td>
              <td className="border p-2">{item.requestNo}</td>
              <td className="border p-2">{item.reportNo}</td>
              <td className="border p-2">{item.productName}</td>
              <td className="border p-2">{item.lotNo}</td>
              <td className="border p-2">
                {item.manufacturerSupplier}
              </td>
              <td className="border p-2">
                {item.manufactureDate}
              </td>
              <td className="border p-2">
                {item.containerQty}
              </td>
              <td className="border p-2">{item.totalQty}</td>
              <td className="border p-2">{item.department}</td>
              <td className="border p-2">{item.remarks}</td>
              <td className="border p-2">
                <button
                onClick={() => deleteItem(index)}
                className="border px-2 py-1"
                >
                  삭제
                  </button>
                  </td>
            </tr>
          ))}
      </tbody>
    </table>
  </div>
)}

      {activeTab === 'result' && (
  <div>
    <table className="w-full border">
      <thead>
  <tr>
    <th className="border p-2">No.</th>
    <th className="border p-2">시험항목</th>
    <th className="border p-2">성적번호</th>
    <th className="border p-2">품목명</th>
    <th className="border p-2">판정결과</th>
    <th className="border p-2">판정일자</th>
    <th className="border p-2">라벨 발행매수</th>
    <th className="border p-2">삭제</th>
  </tr>
</thead>
      <tbody>
        {requestList.map((item, index) => (
          <tr key={index}>
            <td className="border p-2">{index + 1}</td>
            <td className="border p-2">{item.sampleType}</td>
            <td className="border p-2">{item.reportNo}</td>
            <td className="border p-2">{item.productName}</td>

            <td className="border p-2">
              <select
                className="border p-1 w-full"
                value={item.judgement || ''}
                onChange={(e) => {
                  const updatedList = [...requestList]
                  updatedList[index].judgement = e.target.value
                  setRequestList(updatedList)
                  localStorage.setItem(
                    'requestList',
                    JSON.stringify(updatedList)
                  )
                }}
              >
                <option value="">선택</option>
                <option value="적합">적합</option>
                <option value="부적합">부적합</option>
              </select>
            </td>

            <td className="border p-2">
              <input
                type="date"
                className="border p-1 w-full"
                value={
                  item.judgementDate ||
                  new Date().toISOString().split('T')[0]
                }
                onChange={(e) => {
                  const updatedList = [...requestList]
                  updatedList[index].judgementDate = e.target.value
                  setRequestList(updatedList)
                  localStorage.setItem(
                    'requestList',
                    JSON.stringify(updatedList)
                  )
                }}
              />
            </td>

            <td className="border p-2">
              <select
                className="border p-1 w-full"
                value={item.labelQty || '없음'}
                onChange={(e) => {
                  const updatedList = [...requestList]
                  updatedList[index].labelQty = e.target.value
                  setRequestList(updatedList)
                  localStorage.setItem(
                    'requestList',
                    JSON.stringify(updatedList)
                  )
                }}
              >
                <option value="없음">없음</option>
                {Array.from({ length: 500 }, (_, i) => (
                  <option key={i + 1} value={String(i + 1)}>
                    {i + 1}매
                  </option>
                ))}
              </select>
            </td>

            <td className="border p-2">
              <button
              onClick={() => deleteItem(index)}
              className="border px-2 py-1"
                >
                  삭제
                </button>
                </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}
    </div>
  )
}
