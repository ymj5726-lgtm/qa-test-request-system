'use client'

import { useEffect, useState } from 'react'
import PocketBase from 'pocketbase'

const pb = new PocketBase('http://125.251.141.230:8090')

type RequestItem = {
  id?: string
  requester?: string
  productName?: string
  lotNo?: string
  sampleType?: string
  manufacturerSupplier?: string
  manufactureDate?: string
  containerQty?: string
  totalQty?: string
  requestDate?: string
  department?: string
  remarks?: string
  judgementDate?: string
  judgement?: string
  labelQty?: string
  requestNo?: string
  reportNo?: string
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('request')
  const [requestList, setRequestList] = useState<RequestItem[]>([])

  const today = new Date().toISOString().split('T')[0]

  // 기존 상태 그대로 유지
  const [productName, setProductName] = useState('O0330')
  const [lotNo, setLotNo] = useState('')
  const [sampleType, setSampleType] = useState('액체원료')
  const [manufacturerSupplier, setManufacturerSupplier] = useState('')
  const [manufactureDate, setManufactureDate] = useState(today)
  const [containerQty, setContainerQty] = useState('')
  const [totalQty, setTotalQty] = useState('')
  const [requestDate, setRequestDate] = useState(today)
  const [department, setDepartment] = useState('음성공장 합성팀')
  const [remarks, setRemarks] = useState('')

  // ✅ 로그인 + 데이터 로드
  useEffect(() => {
    const init = async () => {
      await pb.admins.authWithPassword(
        'admin@admin.com',
        'admin1234'
      )
      loadData()
    }
    init()
  }, [])

  const loadData = async () => {
    const data = await pb
      .collection('test_requests')
      .getFullList<RequestItem>({
        sort: '-created',
      })

    setRequestList(data)
  }

  // ✅ 의뢰번호 생성 (기존 그대로)
  const generateRequestNo = () => {
    const date = new Date()
    const yy = String(date.getFullYear()).slice(-2)
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    const datePart = `${yy}${mm}${dd}`

    const prefixMap: any = {
      액체원료: 'ER',
      고체원료: 'ER',
      제품: 'EP',
      중간체: 'EB',
    }

    const prefix = prefixMap[sampleType] || 'ER'

    const sameDayCount = requestList.filter((item) =>
      item.requestNo?.startsWith(prefix + datePart)
    ).length

    return `${prefix}${datePart}${String(
      sameDayCount + 1
    ).padStart(2, '0')}`
  }

  // ✅ 저장
  const saveData = async () => {
    const requestNo = generateRequestNo()
    const reportNo = `Q${requestNo}`

    await pb.collection('test_requests').create({
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
      judgement: '',
      judgementDate: today,
      labelQty: '없음',
      requestNo,
      reportNo,
    })

    alert(`저장 완료\n의뢰번호: ${requestNo}`)
    loadData()
  }

  // ✅ 삭제
  const deleteItem = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return
    await pb.collection('test_requests').delete(id)
    loadData()
  }

  // ✅ 결과 업데이트
  const updateItem = async (id: string, field: string, value: string) => {
    await pb.collection('test_requests').update(id, {
      [field]: value,
    })
    loadData()
  }

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">
        시험 의뢰 관리 시스템
      </h1>

      {/* 탭 */}
      <div className="flex gap-3 mb-8">
        <button onClick={() => setActiveTab('request')}>시험의뢰</button>
        <button onClick={() => setActiveTab('ledger')}>접수대장</button>
        <button onClick={() => setActiveTab('result')}>시험결과통보</button>
      </div>

      {/* ================= 시험의뢰 ================= */}
      {activeTab === 'request' && (
        <div className="space-y-3">

          {/* ✅ 품목 옵션 그대로 유지 */}
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

          <input className="border p-2 w-full" placeholder="제조번호" value={lotNo} onChange={(e) => setLotNo(e.target.value)} />
          <input className="border p-2 w-full" placeholder="제조자 / 납품자" value={manufacturerSupplier} onChange={(e) => setManufacturerSupplier(e.target.value)} />
          <input type="date" className="border p-2 w-full" value={manufactureDate} onChange={(e) => setManufactureDate(e.target.value)} />
          <input className="border p-2 w-full" placeholder="용기 수량" value={containerQty} onChange={(e) => setContainerQty(e.target.value)} />
          <input className="border p-2 w-full" placeholder="입고 수량" value={totalQty} onChange={(e) => setTotalQty(e.target.value)} />
          <input type="date" className="border p-2 w-full" value={requestDate} onChange={(e) => setRequestDate(e.target.value)} />

          <select className="border p-2 w-full" value={department} onChange={(e) => setDepartment(e.target.value)}>
            <option value="음성공장 합성팀">음성공장 합성팀</option>
            <option value="음성공장 품질팀">음성공장 품질팀</option>
            <option value="화성공장">화성공장</option>
          </select>

          <select className="border p-2 w-full" value={sampleType} onChange={(e) => setSampleType(e.target.value)}>
            <option value="액체원료">액체원료</option>
            <option value="고체원료">고체원료</option>
            <option value="중간체">중간체</option>
            <option value="제품">제품</option>
          </select>

          <button onClick={saveData} className="bg-black text-white px-4 py-2">
            저장
          </button>
        </div>
      )}

      {/* ================= 접수대장 ================= */}
      {activeTab === 'ledger' && (
        <table className="w-full border text-sm">
          <tbody>
            {requestList.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td>{item.sampleType}</td>
                <td>{item.requestNo}</td>
                <td>{item.reportNo}</td>
                <td>{item.productName}</td>
                <td>
                  <button onClick={() => deleteItem(item.id!)}>삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ================= 결과 ================= */}
      {activeTab === 'result' && (
        <table className="w-full border">
          <tbody>
            {requestList.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td>{item.reportNo}</td>
                <td>{item.productName}</td>

                <td>
                  <select
                    value={item.judgement || ''}
                    onChange={(e) =>
                      updateItem(item.id!, 'judgement', e.target.value)
                    }
                  >
                    <option value="">선택</option>
                    <option value="적합">적합</option>
                    <option value="부적합">부적합</option>
                  </select>
                </td>

                <td>
                  <input
                    type="date"
                    value={item.judgementDate || today}
                    onChange={(e) =>
                      updateItem(item.id!, 'judgementDate', e.target.value)
                    }
                  />
                </td>

                <td>
                  <select
                    value={item.labelQty || '없음'}
                    onChange={(e) =>
                      updateItem(item.id!, 'labelQty', e.target.value)
                    }
                  >
                    <option value="없음">없음</option>
                    {Array.from({ length: 500 }, (_, i) => (
                      <option key={i} value={String(i + 1)}>
                        {i + 1}매
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
