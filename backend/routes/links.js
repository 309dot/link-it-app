const express = require('express');
const router = express.Router();
const Link = require('../models/Link');
const { 
  detectPlatform, 
  generateDeepLinks, 
  generateShortCode, 
  isValidUrl 
} = require('../utils/urlParser');

/**
 * GET /api/links
 * 링크 목록 조회 (페이지네이션 지원)
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || 'createdAt';
    const order = req.query.order === 'asc' ? 1 : -1;
    
    const skip = (page - 1) * limit;
    
    const links = await Link.find({ isActive: true })
      .sort({ [sortBy]: order })
      .skip(skip)
      .limit(limit)
      .select('-__v');
    
    const total = await Link.countDocuments({ isActive: true });
    
    res.json({
      success: true,
      data: {
        links,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('링크 목록 조회 에러:', error);
    res.status(500).json({
      success: false,
      error: '링크 목록을 가져오는데 실패했습니다.'
    });
  }
});

/**
 * GET /api/links/:id
 * 특정 링크 조회
 */
router.get('/:id', async (req, res) => {
  try {
    const link = await Link.findById(req.params.id);
    
    if (!link) {
      return res.status(404).json({
        success: false,
        error: '링크를 찾을 수 없습니다.'
      });
    }
    
    res.json({
      success: true,
      data: link
    });
  } catch (error) {
    console.error('링크 조회 에러:', error);
    res.status(500).json({
      success: false,
      error: '링크 조회에 실패했습니다.'
    });
  }
});

/**
 * POST /api/links
 * 새 링크 생성
 */
router.post('/', async (req, res) => {
  try {
    const { originalUrl, title, description } = req.body;
    
    // URL 유효성 검사
    if (!originalUrl || !isValidUrl(originalUrl)) {
      return res.status(400).json({
        success: false,
        error: '유효한 URL을 입력해주세요.'
      });
    }
    
    // 플랫폼 감지
    const platform = detectPlatform(originalUrl);
    
    // 딥링크 URL 생성
    const { iosUrl, androidUrl } = generateDeepLinks(originalUrl, platform);
    
    // 고유한 단축 코드 생성 (중복 체크)
    let shortCode;
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      shortCode = generateShortCode();
      const existingLink = await Link.findOne({ shortCode });
      if (!existingLink) {
        isUnique = true;
      }
      attempts++;
    }
    
    if (!isUnique) {
      return res.status(500).json({
        success: false,
        error: '고유한 단축 코드를 생성할 수 없습니다. 다시 시도해주세요.'
      });
    }
    
    // 새 링크 생성
    const newLink = new Link({
      shortCode,
      originalUrl,
      iosUrl,
      androidUrl,
      platform,
      title,
      description
    });
    
    await newLink.save();
    
    // 응답 데이터
    const responseData = {
      id: newLink._id,
      shortCode: newLink.shortCode,
      shortUrl: `${process.env.BASE_URL || 'http://localhost:3000'}/${newLink.shortCode}`,
      originalUrl: newLink.originalUrl,
      iosUrl: newLink.iosUrl,
      androidUrl: newLink.androidUrl,
      platform: newLink.platform,
      title: newLink.title,
      description: newLink.description,
      createdAt: newLink.createdAt
    };
    
    res.status(201).json({
      success: true,
      message: '링크가 성공적으로 생성되었습니다.',
      data: responseData
    });
    
  } catch (error) {
    console.error('링크 생성 에러:', error);
    res.status(500).json({
      success: false,
      error: '링크 생성에 실패했습니다.'
    });
  }
});

/**
 * PUT /api/links/:id
 * 링크 수정
 */
router.put('/:id', async (req, res) => {
  try {
    const { title, description, isActive } = req.body;
    
    const link = await Link.findById(req.params.id);
    
    if (!link) {
      return res.status(404).json({
        success: false,
        error: '링크를 찾을 수 없습니다.'
      });
    }
    
    // 수정 가능한 필드만 업데이트
    if (title !== undefined) link.title = title;
    if (description !== undefined) link.description = description;
    if (isActive !== undefined) link.isActive = isActive;
    
    await link.save();
    
    res.json({
      success: true,
      message: '링크가 성공적으로 수정되었습니다.',
      data: link
    });
    
  } catch (error) {
    console.error('링크 수정 에러:', error);
    res.status(500).json({
      success: false,
      error: '링크 수정에 실패했습니다.'
    });
  }
});

/**
 * DELETE /api/links/:id
 * 링크 삭제 (실제로는 비활성화)
 */
router.delete('/:id', async (req, res) => {
  try {
    const link = await Link.findById(req.params.id);
    
    if (!link) {
      return res.status(404).json({
        success: false,
        error: '링크를 찾을 수 없습니다.'
      });
    }
    
    // 실제 삭제 대신 비활성화
    link.isActive = false;
    await link.save();
    
    res.json({
      success: true,
      message: '링크가 성공적으로 삭제되었습니다.'
    });
    
  } catch (error) {
    console.error('링크 삭제 에러:', error);
    res.status(500).json({
      success: false,
      error: '링크 삭제에 실패했습니다.'
    });
  }
});

/**
 * GET /api/links/:id/analytics
 * 링크 분석 데이터 조회
 */
router.get('/:id/analytics', async (req, res) => {
  try {
    const link = await Link.findById(req.params.id);
    
    if (!link) {
      return res.status(404).json({
        success: false,
        error: '링크를 찾을 수 없습니다.'
      });
    }
    
    res.json({
      success: true,
      data: {
        linkId: link._id,
        shortCode: link.shortCode,
        analytics: link.analytics,
        createdAt: link.createdAt,
        lastClickedAt: link.lastClickedAt
      }
    });
    
  } catch (error) {
    console.error('분석 데이터 조회 에러:', error);
    res.status(500).json({
      success: false,
      error: '분석 데이터 조회에 실패했습니다.'
    });
  }
});

module.exports = router;
