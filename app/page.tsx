'use client'

import { useEffect, useState } from 'react'
import PocketBase from 'pocketbase'

const pb = new PocketBase('http://192.168.70.27:8090')

type RequestItem = {
  id: string
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

  useEffect(() => {
    const login = async () => {
    try {
      await pb.admins.authWithPassword(
        'admin@admin.com',
        'admin1234'
      )
      loadData()
    } catch (err) {
      console.error(err)
    }
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

  const generateRequestNo = () => {
    const date = new Date()
    const yy = String(date.getFullYear()).slice(-2)
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    const datePart = `${yy}${mm}${dd}`

    const prefixMap: { [key: string]: string } = {
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

  const deleteItem = async (id: string) => {
    const confirmDelete = window.confirm('삭제하시겠습니까?')
    if (!confirmDelete) return

    await pb.collection('test_requests').delete(id)
    loadData()
  }

  const updateResult = async (
    id: string,
    field: string,
    value: string
  ) => {
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

      <div className="flex gap-3 mb-8">
        <button onClick={() => setActiveTab('request')}>
          시험의뢰
        </button>
        <button onClick={() => setActiveTab('ledger')}>
          접수대장
        </button>
        <button onClick={() => setActiveTab('result')}>
          시험결과통보
        </button>
      </div>

      {activeTab === 'request' && (
        <div className="space-y-3">
          <input
            className="border p-2 w-full"
            placeholder="품명"
            value={productName}
            onChange={(e) =>
              setProductName(e.target.value)
            }
          />

          <input
            className="border p-2 w-full"
            placeholder="제조번호"
            value={lotNo}
            onChange={(e) => setLotNo(e.target.value)}
          />

          <select
            className="border p-2 w-full"
            value={sampleType}
            onChange={(e) =>
              setSampleType(e.target.value)
            }
          >
            <option>액체원료</option>
            <option>고체원료</option>
            <option>제품</option>
            <option>중간체</option>
          </select>

          <button
            onClick={saveData}
            className="bg-black text-white px-4 py-2"
          >
            저장
          </button>
        </div>
      )}

      {activeTab === 'ledger' && (
        <table className="w-full border">
          <thead>
            <tr>
              <th>No.</th>
              <th>시험항목</th>
              <th>의뢰번호</th>
              <th>성적번호</th>
              <th>품명</th>
              <th>삭제</th>
            </tr>
          </thead>
          <tbody>
            {requestList.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td>{item.sampleType}</td>
                <td>{item.requestNo}</td>
                <td>{item.reportNo}</td>
                <td>{item.productName}</td>
                <td>
                  <button
                    onClick={() =>
                      deleteItem(item.id)
                    }
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

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
                      updateResult(
                        item.id,
                        'judgement',
                        e.target.value
                      )
                    }
                  >
                    <option value="">선택</option>
                    <option value="적합">적합</option>
                    <option value="부적합">
                      부적합
                    </option>
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
